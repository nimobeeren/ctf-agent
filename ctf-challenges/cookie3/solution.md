1.  **Log in as `guest`**: First, log in with the credentials `guest`/`guest`.
2.  **Get the JWT**: Open the browser's developer tools and go to the "Storage" or "Application" tab. Find the `session` cookie for the current site.
3.  **Decode the JWT**: The cookie value is a JWT. Copy the value and decode it. You can use an online JWT decoder like [jwt.io](https://jwt.io/).
4.  **Modify the JWT**: The JWT has three parts separated by dots: header, payload, and signature. We need to modify the header and the payload.
    *   **Header**: Change the `alg` field to `none`.
    *   **Payload**: Change the `username` to `admin`.
5.  **Encode the JWT**: Now, encode the modified header and payload back to Base64.
6.  **Construct the new JWT**: The new JWT will have the modified header and payload, and an empty signature. The format is `base64(header).base64(payload).` (note the trailing dot).
7.  **Set the new cookie**: Go back to the browser's developer tools and replace the old `session` cookie value with the new one.
8.  **Refresh the page**: Refresh the page, and you should see the flag.
