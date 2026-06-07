package com.hornero.notifications.dto;

public class UnreadCountResponse {

    private long count;

    public UnreadCountResponse(long count) {
        this.count = count;
    }

    public long getCount() { return count; }
}
