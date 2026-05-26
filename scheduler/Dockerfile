FROM alpine:3.19
RUN apk add --no-cache curl
COPY finalize-campaigns.sh /finalize-campaigns.sh
COPY crontab /etc/crontabs/root
RUN sed -i 's/\r//' /finalize-campaigns.sh && chmod +x /finalize-campaigns.sh && mkdir -p /var/log && touch /var/log/scheduler.log
CMD ["crond", "-f", "-d", "8"]
