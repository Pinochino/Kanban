package com.example.trello.service.mail;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.InputStreamResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

import java.io.File;
import java.io.InputStream;

@Service
@FieldDefaults(level = AccessLevel.PRIVATE)
@RequiredArgsConstructor
public class MailServiceImpl implements MailService {

    final JavaMailSender mailSender;
    final SpringTemplateEngine templateEngine;

    @Value("${mail.username}")
    String sender;

    @Async
    @Override
    public void sendSimpleMessage(
            String to, String subject, String name, String body) {


        Context context = new Context();
        context.setVariable("name", name);
        context.setVariable("message", body);

        // 2. Process template to String
        String htmlContent = templateEngine.process("email-template", context);

        // 3. Create and send MimeMessage
        MimeMessage message = mailSender.createMimeMessage();
        try {
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(sender);
            helper.setTo(to);
            helper.setText(htmlContent, true);

        } catch (MessagingException e) {
            throw new RuntimeException(e);
        }

        mailSender.send(message);
    }

    @Async
    @Override
    public void sendMessageWithInputStreamAttachment(
            String to, String subject, String text, String attachmentName, InputStream attachmentStream) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);

            helper.setFrom("noreply@baeldung.com");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(text);

            // Add the attachment from InputStream
            helper.addAttachment(attachmentName, new InputStreamResource(attachmentStream));

            mailSender.send(message);
        } catch (MessagingException e) {
            e.printStackTrace();
        }
    }

    @Async
    @Override
    public void sendMessageWithAttachment(
            String to, String subject, String text, String pathToAttachment) throws MessagingException {

        MimeMessage message = mailSender.createMimeMessage();

        MimeMessageHelper helper = new MimeMessageHelper(message, true);

        helper.setFrom(sender);
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(text);

        FileSystemResource file
                = new FileSystemResource(new File(pathToAttachment));
        helper.addAttachment("Invoice", file);

        mailSender.send(message);

    }

}
