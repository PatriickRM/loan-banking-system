package com.auth.service.service;

import com.auth.service.entity.User;

public interface EmailService {

    void sendVerificationEmail(User user, String token);

}
