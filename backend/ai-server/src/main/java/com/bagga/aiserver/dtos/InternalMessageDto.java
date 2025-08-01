package com.bagga.aiserver.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InternalMessageDto {
    private String message;
    private MultipartFile file;
    private String senderId;
    private String recipientId;
}
