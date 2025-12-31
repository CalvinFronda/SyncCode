FROM python:3.11-slim


# Create non-root user
RUN useradd -m runner

WORKDIR /home/runner

# Copy script and set permissions as root
COPY run.sh .
RUN chmod +x run.sh

# Switch to non-root
USER runner

# Disable network tools (can be done as root)
RUN rm -rf /usr/bin/curl /usr/bin/wget

ENTRYPOINT ["sh","./run.sh"]
