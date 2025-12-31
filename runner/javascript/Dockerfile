FROM node:20-alpine

# Create non-root user
RUN adduser -D runner
WORKDIR /home/runner

COPY run.sh .


USER runner

# Remove network tools (alpine)
RUN rm -rf /usr/bin/wget /usr/bin/curl


ENTRYPOINT ["sh", "./run.sh"]
