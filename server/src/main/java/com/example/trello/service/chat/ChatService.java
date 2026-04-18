package com.example.trello.service.chat;

import com.example.trello.dto.request.SendChatMessageRequest;
import com.example.trello.dto.request.CreateChatGroupRequest;
import com.example.trello.dto.request.SendChatGroupMessageRequest;
import com.example.trello.dto.response.ChatContactResponse;
import com.example.trello.dto.response.ChatGroupResponse;
import com.example.trello.dto.response.ChatMessageResponse;
import com.example.trello.dto.response.PagedResponse;

import java.util.List;

public interface ChatService {

    List<ChatContactResponse> getContacts();

    List<ChatGroupResponse> getGroups();

    ChatGroupResponse createGroup(CreateChatGroupRequest request);

    PagedResponse<ChatMessageResponse> getConversation(Long otherUserId, int page, int size);

    PagedResponse<ChatMessageResponse> getGroupConversation(Long groupId, int page, int size);

    ChatMessageResponse sendMessage(SendChatMessageRequest request);

    ChatMessageResponse sendGroupMessage(Long groupId, SendChatGroupMessageRequest request);
}
