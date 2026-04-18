package com.example.trello.controller;

import com.example.trello.dto.request.SendChatMessageRequest;
import com.example.trello.dto.request.CreateChatGroupRequest;
import com.example.trello.dto.request.SendChatGroupMessageRequest;
import com.example.trello.dto.response.AppResponse;
import com.example.trello.dto.response.ChatContactResponse;
import com.example.trello.dto.response.ChatGroupResponse;
import com.example.trello.dto.response.ChatMessageResponse;
import com.example.trello.dto.response.PagedResponse;
import com.example.trello.service.chat.ChatService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/chats")
@RequiredArgsConstructor
@CrossOrigin
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ChatController {

    ChatService chatService;

    @GetMapping("/contacts")
    public ResponseEntity<AppResponse<List<ChatContactResponse>>> getContacts() {
        return ResponseEntity.ok(new AppResponse<>(200, "Get contacts success", chatService.getContacts()));
    }

    @GetMapping("/groups")
    public ResponseEntity<AppResponse<List<ChatGroupResponse>>> getGroups() {
        return ResponseEntity.ok(new AppResponse<>(200, "Get groups success", chatService.getGroups()));
    }

    @PostMapping("/groups")
    public ResponseEntity<AppResponse<ChatGroupResponse>> createGroup(@Valid @RequestBody CreateChatGroupRequest request) {
        return ResponseEntity.ok(new AppResponse<>(200, "Create group success", chatService.createGroup(request)));
    }

    @GetMapping("/conversation/{otherUserId}")
    public ResponseEntity<AppResponse<PagedResponse<ChatMessageResponse>>> getConversation(
            @PathVariable Long otherUserId,
            @RequestParam(value = "page", defaultValue = "0", required = false) int page,
            @RequestParam(value = "size", defaultValue = "20", required = false) int size
    ) {
        return ResponseEntity.ok(new AppResponse<>(200, "Get conversation success", chatService.getConversation(otherUserId, page, size)));
    }

    @GetMapping("/groups/{groupId}/conversation")
    public ResponseEntity<AppResponse<PagedResponse<ChatMessageResponse>>> getGroupConversation(
            @PathVariable Long groupId,
            @RequestParam(value = "page", defaultValue = "0", required = false) int page,
            @RequestParam(value = "size", defaultValue = "20", required = false) int size
    ) {
        return ResponseEntity.ok(new AppResponse<>(200, "Get group conversation success", chatService.getGroupConversation(groupId, page, size)));
    }

    @PostMapping("/send")
    public ResponseEntity<AppResponse<ChatMessageResponse>> sendMessage(@Valid @RequestBody SendChatMessageRequest request) {
        return ResponseEntity.ok(new AppResponse<>(200, "Send message success", chatService.sendMessage(request)));
    }

    @PostMapping("/groups/{groupId}/send")
    public ResponseEntity<AppResponse<ChatMessageResponse>> sendGroupMessage(
            @PathVariable Long groupId,
            @Valid @RequestBody SendChatGroupMessageRequest request
    ) {
        return ResponseEntity.ok(new AppResponse<>(200, "Send group message success", chatService.sendGroupMessage(groupId, request)));
    }
}
