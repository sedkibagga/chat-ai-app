package com.bagga.aiserver.services;


import com.bagga.aiserver.dtos.InternalMessageDto;
import com.bagga.aiserver.entities.ChatMessages;
import com.bagga.aiserver.repositories.ChatMessageRepository;
import com.bagga.aiserver.responses.MessageToSpeakResponse;
import com.google.genai.Client;
import com.google.genai.types.GenerateContentResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatMessageService {
    private final ChatMessageRepository chatMessageRepository ;
    private final ChatRoomService chatRoomService ;
    private final TextToSpeechService textToSpeechService ;
    private final PdfExtractorService pdfExtractorService;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public ChatMessages createMessage(InternalMessageDto messageDto) {
        try {
            String content = messageDto.getMessage() != null ? messageDto.getMessage() : "No message";


            log.info("content: {}", content);

            String chatRoomId = chatRoomService
                    .getChatRoomId(messageDto.getSenderId(), messageDto.getRecipientId(), true)
                    .orElseThrow(() -> new RuntimeException("Chat room not found"));

            Client client = new Client();
            GenerateContentResponse response =
                    client.models.generateContent(
                            "gemini-2.0-flash",
                            content,
                            null);

            MessageToSpeakResponse messageToSpeakResponse = MessageToSpeakResponse.builder()
                    .spokenText(response.text())
                    .build();
            this.messagingTemplate.convertAndSendToUser(
                    messageDto.getSenderId(),
                    "/queue/messages/ai-asistant-spoken",
                    messageToSpeakResponse
            );

            ChatMessages chatMessagesSended = ChatMessages.builder()
                    .senderId(messageDto.getSenderId())
                    .recipientId(messageDto.getRecipientId())
                    .content(content)
                    .chatId(chatRoomId)
                    .timestamp(Instant.now().toString())
                    .build();

            this.chatMessageRepository.save(chatMessagesSended);
            ChatMessages chatMessagesSendedByAi = ChatMessages.builder()
                    .senderId(messageDto.getRecipientId())
                    .recipientId(messageDto.getSenderId())
                    .content(response.text())
                    .chatId(chatRoomId)
                    .timestamp(Instant.now().toString())
                    .build();
            return this.chatMessageRepository.save(chatMessagesSendedByAi);

        } catch (Exception e) {
            throw new RuntimeException("Failed to create message", e);
        }
    }

    public void deleteAll() {
        this.chatMessageRepository.deleteAll();
    }

    public List<ChatMessages> getAllMessages () {
        return this.chatMessageRepository.findAll();
    }

    public List<ChatMessages> findChatMessages (String senderId, String recipientId) {
        try{
            var chaRoomId = this.chatRoomService.getChatRoomId(senderId , recipientId, true).orElseThrow(() -> new RuntimeException("Chat room not found"));
            return this.chatMessageRepository.findByChatId(chaRoomId);

        }catch (Exception e) {
            log.error("Error getting messages by chat id", e);
            throw new RuntimeException("Error getting messages by chat id", e);
        }
    }


}
