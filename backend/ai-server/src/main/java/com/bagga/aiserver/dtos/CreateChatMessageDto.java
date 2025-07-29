package com.bagga.aiserver.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateChatMessageDto {
    private String senderId;
    private String recipientId;
    private String content;
}
