FROM alpine:3.19
ENV TZ=America/Argentina/Buenos_Aires
RUN apk add --no-cache curl tzdata
COPY finalize-campaigns.sh /finalize-campaigns.sh
COPY crontab /etc/crontabs/root
RUN sed -i 's/\r//' /finalize-campaigns.sh && sed -i 's/\r//' /etc/crontabs/root && chmod +x /finalize-campaigns.sh && mkdir -p /var/log && touch /var/log/scheduler.log
CMD ["crond", "-f", "-d", "8"]
