package com.bagga.aiserver.controller;

import com.bagga.aiserver.dtos.AskGeminiMessageDto;
import com.bagga.aiserver.dtos.CreateMessageDto;
import com.bagga.aiserver.dtos.InternalMessageDto;
import com.bagga.aiserver.entities.ChatMessages;
import com.bagga.aiserver.entities.ChatRoom;
import com.bagga.aiserver.entities.Messages;
import com.bagga.aiserver.repositories.MessageRepository;
import com.bagga.aiserver.services.ChatMessageService;
import com.bagga.aiserver.services.ChatRoomService;
import com.google.genai.Client;
import com.google.genai.types.GenerateContentResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.checkerframework.checker.units.qual.C;
import org.springframework.http.MediaType;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.mock.web.MockMultipartFile;

import java.util.Base64;
import java.util.List;

@RestController
@RequiredArgsConstructor
@Slf4j
public class GeminiController {
    private final MessageRepository messageRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final ChatMessageService chatMessageService;
    private final ChatRoomService chatRoomService;
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

    @MessageMapping("/chat/ask-ai-assistant")
    public void askAiAssistant(@Payload CreateMessageDto messageDto) {
        try {
            log.info("messageDto: {}", messageDto);
            MultipartFile file = null;
            if (messageDto.getFileContent() != null && messageDto.getFileName() != null) {
                byte[] decoded = Base64.getDecoder().decode(messageDto.getFileContent());
                file = new MockMultipartFile(
                        messageDto.getFileName(),
                        messageDto.getFileName(),
                        "application/pdf",
                        decoded
                );
            }



            InternalMessageDto internal = InternalMessageDto.builder()
                    .message(messageDto.getMessage())
                    .file(file)
                    .senderId(messageDto.getSenderId())
                    .recipientId(messageDto.getRecipientId())
                    .build();

            ChatMessages created = chatMessageService.createMessage(internal);

            messagingTemplate.convertAndSendToUser(
                    messageDto.getSenderId(),
                    "/queue/messages/ask-ai-assistant",
                    created
            );


        } catch (Exception e) {
            log.error("WebSocket error", e);
        }
    }


    @PostMapping(value = "/chat/ask-ai-assistant", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ChatMessages chatMessages(
            @RequestPart(required = false) String message,
            @RequestPart(required = false) MultipartFile file,
            @RequestPart String senderId,
            @RequestPart String recipientId
    ) {
        InternalMessageDto messageDto = InternalMessageDto.builder()
                .message(message)
                .file(file)
                .senderId(senderId)
                .recipientId(recipientId)
                .build();

        ChatMessages messagesCreated = this.chatMessageService.createMessage(messageDto);
        return messagesCreated;
    }
    @DeleteMapping("deleteAll")
    public void deleteAll() {
       this.chatMessageService.deleteAll();
    }

    @GetMapping("getAllMessages")
    public List<ChatMessages> getAllMessages() {
        return this.chatMessageService.getAllMessages();
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

    @GetMapping("/findChatMessages/{senderId}/{recipientId}")
    public List<ChatMessages> findChatMessages(@PathVariable String senderId, @PathVariable String recipientId) {
        return this.chatMessageService.findChatMessages(senderId, recipientId);
    }

    @GetMapping("findAllChatRooms")
    public List<ChatRoom> findAllChatRooms() {
        return this.chatRoomService.findAllChatRooms();
    }
}

