package com.example.trello.service.chat;

import com.example.trello.constants.ErrorCode;
import com.example.trello.constants.RoleName;
import com.example.trello.dto.request.CreateChatGroupRequest;
import com.example.trello.dto.request.SendChatMessageRequest;
import com.example.trello.dto.request.SendChatGroupMessageRequest;
import com.example.trello.dto.response.ChatContactResponse;
import com.example.trello.dto.response.ChatGroupResponse;
import com.example.trello.dto.response.ChatMessageResponse;
import com.example.trello.dto.response.PagedResponse;
import com.example.trello.exception.AppError;
import com.example.trello.model.Account;
import com.example.trello.model.ChatGroup;
import com.example.trello.model.ChatGroupMessage;
import com.example.trello.model.ChatMessage;
import com.example.trello.repository.AccountRepository;
import com.example.trello.repository.ChatGroupMessageRepository;
import com.example.trello.repository.ChatGroupRepository;
import com.example.trello.repository.ChatMessageRepository;
import com.example.trello.utils.JwtUtil;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static java.util.Objects.isNull;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ChatServiceImpl implements ChatService {

    JwtUtil jwtUtil;
    AccountRepository accountRepository;
    ChatGroupRepository chatGroupRepository;
    ChatGroupMessageRepository chatGroupMessageRepository;
    ChatMessageRepository chatMessageRepository;

    @Override
    public List<ChatContactResponse> getContacts() {
        Account currentUser = jwtUtil.getCurrentUserLogin();
        boolean isAdmin = hasAdminRole(currentUser);

        List<Account> accounts = accountRepository.findChatContacts(currentUser.getId());

        return accounts.stream()
                .filter(account -> isAdmin || isChatVisibleForUser(currentUser, account))
                .map(account -> toContactResponse(currentUser, account))
                .sorted(Comparator.comparing(ChatContactResponse::getUsername, Comparator.nullsLast(String::compareToIgnoreCase)))
                .toList();
    }

    @Override
    public List<ChatGroupResponse> getGroups() {
        Account currentUser = jwtUtil.getCurrentUserLogin();

        return chatGroupRepository.findGroupsForMember(currentUser.getId()).stream()
                .map(this::toGroupResponse)
                .sorted(Comparator.comparing(ChatGroupResponse::getLastMessageAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed()
                        .thenComparing(ChatGroupResponse::getName, Comparator.nullsLast(String::compareToIgnoreCase)))
                .toList();
    }

    @Override
    @Transactional
    public ChatGroupResponse createGroup(CreateChatGroupRequest request) {
        Account currentUser = jwtUtil.getCurrentUserLogin();
        String groupName = request.getName() != null ? request.getName().trim() : "";

        if (groupName.isBlank()) {
            throw new AppError(ErrorCode.CHAT_GROUP_NAME_INVALID);
        }

        Set<Long> memberIds = new HashSet<>();
        if (request.getMemberIds() != null) {
            memberIds.addAll(request.getMemberIds().stream()
                    .filter(java.util.Objects::nonNull)
                    .toList());
        }
        memberIds.add(currentUser.getId());

        if (memberIds.size() < 2) {
            throw new AppError(ErrorCode.CHAT_GROUP_MEMBER_REQUIRED);
        }

        List<Account> members = accountRepository.findAllById(memberIds).stream()
                .filter(Account::isActive)
                .filter(account -> !account.isDeleted())
                .toList();

        if (members.size() != memberIds.size()) {
            throw new AppError(ErrorCode.USER_NOT_FOUND);
        }

        ChatGroup group = ChatGroup.builder()
                .name(groupName)
                .description(request.getDescription())
                .creator(currentUser)
                .members(new HashSet<>(members))
                .build();

        group = chatGroupRepository.save(group);
        return toGroupResponse(group);
    }

    @Override
    @Transactional
    public PagedResponse<ChatMessageResponse> getConversation(Long otherUserId, int page, int size) {
        Account currentUser = jwtUtil.getCurrentUserLogin();
        Account otherUser = accountRepository.findById(otherUserId)
                .orElseThrow(() -> new AppError(ErrorCode.USER_NOT_FOUND));

        if (!otherUser.isActive() || otherUser.isDeleted()) {
            throw new AppError(ErrorCode.USER_NOT_FOUND);
        }

        ensureChatAllowed(currentUser, otherUser);

        int validatedPage = Math.max(page, 0);
        int validatedSize = Math.min(Math.max(size, 1), 100);
        Pageable pageable = PageRequest.of(validatedPage, validatedSize, Sort.by(Sort.Order.asc("createdAt"), Sort.Order.asc("id")));

        chatMessageRepository.markConversationAsRead(otherUser.getId(), currentUser.getId());

        Page<ChatMessage> messagePage = chatMessageRepository.findConversation(currentUser.getId(), otherUser.getId(), pageable);
        List<ChatMessageResponse> items = messagePage.getContent().stream()
                .map(this::toMessageResponse)
            .sorted(Comparator.comparing(ChatMessageResponse::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(ChatMessageResponse::getId, Comparator.nullsLast(Comparator.comparingLong(value -> Long.parseLong(String.valueOf(value))))))
                .toList();

        return PagedResponse.<ChatMessageResponse>builder()
                .items(items)
                .totalElements(messagePage.getTotalElements())
                .totalPages(messagePage.getTotalPages())
                .page(messagePage.getNumber())
                .size(messagePage.getSize())
                .hasNext(messagePage.hasNext())
                .hasPrevious(messagePage.hasPrevious())
                .build();
    }

            @Override
            @Transactional
            public PagedResponse<ChatMessageResponse> getGroupConversation(Long groupId, int page, int size) {
            Account currentUser = jwtUtil.getCurrentUserLogin();
            ChatGroup group = chatGroupRepository.findByIdAndMemberId(groupId, currentUser.getId())
                .orElseThrow(() -> new AppError(ErrorCode.CHAT_GROUP_FORBIDDEN));

            int validatedPage = Math.max(page, 0);
            int validatedSize = Math.min(Math.max(size, 1), 100);
            Pageable pageable = PageRequest.of(validatedPage, validatedSize, Sort.by(Sort.Order.asc("createdAt"), Sort.Order.asc("id")));

            Page<ChatGroupMessage> messagePage = chatGroupMessageRepository.findConversation(group.getId(), pageable);
            List<ChatMessageResponse> items = messagePage.getContent().stream()
                .map(message -> toGroupMessageResponse(message, group))
                .toList();

            return PagedResponse.<ChatMessageResponse>builder()
                .items(items)
                .totalElements(messagePage.getTotalElements())
                .totalPages(messagePage.getTotalPages())
                .page(messagePage.getNumber())
                .size(messagePage.getSize())
                .hasNext(messagePage.hasNext())
                .hasPrevious(messagePage.hasPrevious())
                .build();
            }

    @Override
    @Transactional
    public ChatMessageResponse sendMessage(SendChatMessageRequest request) {
        Account currentUser = jwtUtil.getCurrentUserLogin();
        Account receiver = accountRepository.findById(request.getReceiverId())
                .orElseThrow(() -> new AppError(ErrorCode.USER_NOT_FOUND));

        if (!receiver.isActive() || receiver.isDeleted()) {
            throw new AppError(ErrorCode.USER_NOT_FOUND);
        }

        ensureChatAllowed(currentUser, receiver);

        ChatMessage message = ChatMessage.builder()
                .sender(currentUser)
                .receiver(receiver)
                .content(request.getContent().trim())
                .isRead(false)
                .build();

        message = chatMessageRepository.save(message);
        return toMessageResponse(message);
    }

    @Override
    @Transactional
    public ChatMessageResponse sendGroupMessage(Long groupId, SendChatGroupMessageRequest request) {
        Account currentUser = jwtUtil.getCurrentUserLogin();
        ChatGroup group = chatGroupRepository.findByIdAndMemberId(groupId, currentUser.getId())
                .orElseThrow(() -> new AppError(ErrorCode.CHAT_GROUP_FORBIDDEN));

        ChatGroupMessage message = ChatGroupMessage.builder()
                .chatGroup(group)
                .sender(currentUser)
                .content(request.getContent().trim())
                .build();

        message = chatGroupMessageRepository.save(message);
        return toGroupMessageResponse(message, group);
    }

    private ChatContactResponse toContactResponse(Account currentUser, Account account) {
        ChatMessage latestMessage = chatMessageRepository.findLatestConversationMessages(
                        currentUser.getId(),
                        account.getId(),
                        PageRequest.of(0, 1, Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id")))
                )
                .stream()
                .findFirst()
                .orElse(null);

        long unreadCount = chatMessageRepository.countUnreadBySenderAndReceiver(account.getId(), currentUser.getId());

        return ChatContactResponse.builder()
                .id(account.getId())
                .username(account.getUsername())
                .email(account.getEmail())
                .avatarUrl(account.getAvatarUrl())
                .roleName(account.getRoles().stream().findFirst().map(role -> role.getName().name()).orElse(RoleName.USER.name()))
                .unreadCount(unreadCount)
                .lastMessageAt(latestMessage != null ? latestMessage.getCreatedAt() : null)
                .lastMessagePreview(latestMessage != null ? latestMessage.getContent() : null)
                .build();
    }

    private ChatMessageResponse toMessageResponse(ChatMessage message) {
        return ChatMessageResponse.builder()
                .id(message.getId())
                .senderId(message.getSender() != null ? message.getSender().getId() : null)
                .senderName(message.getSender() != null ? message.getSender().getUsername() : null)
                .senderAvatarUrl(message.getSender() != null ? message.getSender().getAvatarUrl() : null)
                .receiverId(message.getReceiver() != null ? message.getReceiver().getId() : null)
                .receiverName(message.getReceiver() != null ? message.getReceiver().getUsername() : null)
                .receiverAvatarUrl(message.getReceiver() != null ? message.getReceiver().getAvatarUrl() : null)
                .groupId(null)
                .groupName(null)
                .content(message.getContent())
                .isRead(message.isRead())
                .createdAt(message.getCreatedAt())
                .build();
    }

    private ChatMessageResponse toGroupMessageResponse(ChatGroupMessage message, ChatGroup group) {
        return ChatMessageResponse.builder()
                .id(message.getId())
                .senderId(message.getSender() != null ? message.getSender().getId() : null)
                .senderName(message.getSender() != null ? message.getSender().getUsername() : null)
                .senderAvatarUrl(message.getSender() != null ? message.getSender().getAvatarUrl() : null)
                .receiverId(null)
                .receiverName(null)
                .receiverAvatarUrl(null)
                .groupId(group != null ? group.getId() : null)
                .groupName(group != null ? group.getName() : null)
                .content(message.getContent())
                .isRead(true)
                .createdAt(message.getCreatedAt())
                .build();
    }

    private ChatGroupResponse toGroupResponse(ChatGroup group) {
        ChatGroupMessage latestMessage = chatGroupMessageRepository.findLatestConversationMessages(
                        group.getId(),
                        PageRequest.of(0, 1, Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id")))
                )
                .stream()
                .findFirst()
                .orElse(null);

        return ChatGroupResponse.builder()
                .id(group.getId())
                .name(group.getName())
                .description(group.getDescription())
                .creatorId(group.getCreator() != null ? group.getCreator().getId() : null)
                .creatorName(group.getCreator() != null ? group.getCreator().getUsername() : null)
                .memberCount(group.getMembers() != null ? group.getMembers().size() : 0)
                .lastMessagePreview(latestMessage != null ? latestMessage.getContent() : null)
                .lastMessageAt(latestMessage != null ? latestMessage.getCreatedAt() : null)
                .createdAt(group.getCreatedAt())
                .build();
    }

    private void ensureChatAllowed(Account currentUser, Account otherUser) {
        if (currentUser == null || otherUser == null) {
            throw new AppError(ErrorCode.USER_NOT_FOUND);
        }

        if (currentUser.getId().equals(otherUser.getId())) {
            return;
        }

        if (hasAdminRole(currentUser)) {
            return;
        }

        if (hasAdminRole(otherUser)) {
            return;
        }
    }

    private boolean isChatVisibleForUser(Account currentUser, Account candidate) {
        return candidate != null && !candidate.getId().equals(currentUser.getId());
    }

    private boolean hasAdminRole(Account account) {
        if (account == null || account.getRoles() == null) {
            return false;
        }

        return account.getRoles().stream()
                .map(role -> role.getName())
                .anyMatch(roleName -> roleName == RoleName.SUPER_ADMIN || roleName == RoleName.ADMIN);
    }
}
