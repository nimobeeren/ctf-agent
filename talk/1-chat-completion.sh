curl --location "$AZURE_OPENAI_ENDPOINT/openai/deployments/gpt-4.1/chat/completions" \
--header 'Content-Type: application/json' \
--header "api-key: $AZURE_OPENAI_API_KEY" \
--data '{
  "messages": [
    {
      "role": "user",
      "content": "Hello world!"
    }
  ]
}'
