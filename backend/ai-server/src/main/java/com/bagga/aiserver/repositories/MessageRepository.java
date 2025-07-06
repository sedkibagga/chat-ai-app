package com.bagga.aiserver.repositories;

import com.bagga.aiserver.entities.Messages;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MessageRepository extends MongoRepository<Messages, String> {
}
