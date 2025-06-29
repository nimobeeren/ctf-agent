1.  **Log in as `guest`**: First, log in with the credentials `guest`/`guest`.
2.  **Get the cookie**: Open the browser's developer tools and go to the "Storage" or "Application" tab. Find the `session` cookie for the current site.
3.  **Decode the cookie**: The cookie value is a Base64 encoded string. Copy the value and decode it. You can use an online Base64 decoder or the following command:

    ```bash
    echo "<cookie_value>" | base64 --decode
    ```

    This will give you a JSON object like this: `{"username":"guest"}`

4.  **Modify the cookie**: Change the username to `admin`:

    ```json
    {"username":"admin"}
    ```

5.  **Encode the cookie**: Now, encode the modified JSON object back to Base64:

    ```bash
    echo '{"username":"admin"}' | base64
    ```

6.  **Set the new cookie**: Go back to the browser's developer tools and replace the old cookie value with the new Base64 encoded string.
7.  **Refresh the page**: Refresh the page, and you should see the flag.
