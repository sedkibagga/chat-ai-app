package com.bagga.aiserver.services;

import com.bagga.aiserver.dtos.CreateChatMessageDto;
import com.bagga.aiserver.entities.ChatMessages;
import com.bagga.aiserver.repositories.ChatMessageRepository;
import lombok.RequiredArgsConstructor;
import org.checkerframework.checker.units.qual.C;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ChatMessageService {
    private final ChatMessageRepository chatMessageRepository ;
    private final ChatRoomService chatRoomService ;

//    public ChatMessages saveChatMessage (CreateChatMessageDto createChatMessageDto) {
//
//    }


}
