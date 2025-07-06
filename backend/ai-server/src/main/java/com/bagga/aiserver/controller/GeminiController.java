package com.bagga.aiserver.controller;

import com.bagga.aiserver.dtos.AskGeminiMessageDto;
import com.bagga.aiserver.dtos.CreateMessageDto;
import com.bagga.aiserver.entities.Messages;
import com.bagga.aiserver.repositories.MessageRepository;
import com.google.genai.Client;
import com.google.genai.types.GenerateContentResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Slf4j
public class GeminiController {
    private final MessageRepository messageRepository;

    @MessageMapping("/ask-gemini")
    @SendTo("/topic/public")
    public String askGeminiMessage (@Payload AskGeminiMessageDto messageDto) {
        try {
            Client client = new Client();
            GenerateContentResponse response =
                    client.models.generateContent(
                            "gemini-2.0-flash",
                            messageDto.getMessage(),
                            null);
            CreateMessageDto dto = CreateMessageDto.builder()
                    .message(response.text())
                    .build();
            this.createMessage(dto);
            log.info(response.text());
            return response.text();
        } catch (Exception error) {
            log.error(error.getMessage());
            throw new RuntimeException("error in gemini");
        }
    }

    @GetMapping("/ask-gemini")
    public String askGemini() throws Exception {

        try {
            Client client = new Client();
            GenerateContentResponse response =
                    client.models.generateContent(
                            "gemini-2.0-flash",
                            "tell me who is neymar",
                            null);
            CreateMessageDto messageDto = CreateMessageDto.builder()
                    .message(response.text())
                    .build();
            this.createMessage(messageDto);
            return response.text();

        }catch (Exception error) {
            log.error(error.getMessage());
            throw new RuntimeException("error in gemini");
        }

    }

    @PostMapping("/createMessage")
    public Messages createMessage(@RequestBody CreateMessageDto messageDto) {
        log.info("message: {}", messageDto);
        Messages messageCreated = Messages.builder()
                .message(messageDto.getMessage())
                .build();
        log.info("messageCreated: {}", messageCreated);
        Messages savedMessage = this.messageRepository.save(messageCreated);
        log.info("savedMessage: {}", savedMessage);
        return savedMessage;
    }


    @GetMapping("/getMessages")
    public List<Messages> getMessages() {
        return this.messageRepository.findAll();
    }
}
