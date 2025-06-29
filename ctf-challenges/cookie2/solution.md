1.  **Log in as `guest`**: First, log in with the credentials `guest`/`guest`.
2.  **Get the cookies**: Open the browser's developer tools and go to the "Storage" or "Application" tab. Find the `session` and `integrity` cookies for the current site.
3.  **Decode the session cookie**: The cookie value is a Base64 encoded string. Copy the value and decode it. You can use an online Base64 decoder or the following command:

    ```bash
    echo "<cookie_value>" | base64 --decode
    ```

    This will give you a JSON object like this: `{"username": "guest"}`

4.  **Modify the session cookie**: Change the username to `admin`:

    ```json
    {"username": "admin"}
    ```

5.  **Encode the session cookie**: Now, encode the modified JSON object back to Base64:

    ```bash
    echo '{"username": "admin"}' | base64
    ```

6.  **Calculate the new integrity hash**: The `integrity` cookie is the SHA256 hash of the `session` cookie. You can calculate the new hash using the following command:

    ```bash
    echo -n "<new_base64_session_cookie>" | shasum -a 256
    ```

7.  **Set the new cookies**: Go back to the browser's developer tools and replace the old `session` and `integrity` cookie values with the new ones.
8.  **Refresh the page**: Refresh the page, and you should see the flag.
