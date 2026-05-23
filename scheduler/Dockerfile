FROM alpine:3.19
RUN apk add --no-cache curl
COPY finalize-campaigns.sh /finalize-campaigns.sh
COPY crontab /etc/crontabs/root
RUN chmod +x /finalize-campaigns.sh
CMD ["crond", "-f", "-d", "8"]
