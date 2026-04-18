package com.example.trello.service.mail;

import jakarta.mail.MessagingException;
import org.springframework.scheduling.annotation.Async;

import java.io.InputStream;

public interface MailService {
    @Async
    void sendSimpleMessage(
            String to, String subject, String name, String body);

    @Async
    void sendMessageWithInputStreamAttachment(
            String to, String subject, String text, String attachmentName, InputStream attachmentStream);

    @Async
    void sendMessageWithAttachment(
            String to, String subject, String text, String pathToAttachment) throws MessagingException;
}
