package com.kong.kong_dic.common.dto;

import lombok.*;

@Getter @Setter
@Builder
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class NotificationMessage {
    private String username;
    private String title;
    private String content;
    private String type;
}