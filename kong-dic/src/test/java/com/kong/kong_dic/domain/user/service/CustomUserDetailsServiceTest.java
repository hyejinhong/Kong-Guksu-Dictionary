package com.kong.kong_dic.domain.user.service;

import com.kong.kong_dic.domain.user.entity.Role;
import com.kong.kong_dic.domain.user.entity.User;
import com.kong.kong_dic.domain.user.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class CustomUserDetailsServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CustomUserDetailsService customUserDetailsService;

    @Test
    @DisplayName("성공: 대소문자 다른 입력으로 유저 조회 성공 (Abc -> abc)")
    void loadUserByUsername_caseInsensitive_success() {
        // given
        User user = User.builder()
                .id(1L)
                .username("Abc")
                .password("password123")
                .role(Role.USER)
                .build();

        when(userRepository.findByUsernameIgnoreCase("abc")).thenReturn(Optional.of(user));

        // when
        UserDetails userDetails = customUserDetailsService.loadUserByUsername("abc");

        // then
        assertThat(userDetails).isNotNull();
        assertThat(userDetails.getUsername()).isEqualTo("Abc");
    }

    @Test
    @DisplayName("실패: 존제하지 않는 유저 조회시 UsernameNotFoundException 예외 발생")
    void loadUserByUsername_notFound_throwsException() {
        // given
        when(userRepository.findByUsernameIgnoreCase("unknown")).thenReturn(Optional.empty());

        // when & then
        assertThrows(UsernameNotFoundException.class, () -> {
            customUserDetailsService.loadUserByUsername("unknown");
        });
    }
}
