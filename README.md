# anti-block-deepseek
Deploy to Vercel or Netlify and bypass local Deepseek blocks.

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/rhijjawi/anti-block-deepseek)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Frhijjawi%2Fanti-block-deepseekworld)

## Justification
This site aims to provide an AI chat interface that bypasses arbitrary restrictions imposed by workplaces, ensuring fair access to different models. Recent events, such as offices blocking Deepseek Chat while continuing to allow ChatGPT, highlight inconsistencies in AI access that limit user choice.

## ENV Setup
```.env
DEEPSEEK_API_KEY=YOUR_DEEPSEEK_API_KEY
JWT_SECRET=A_JWT_SECRET
PLATFORM_PASSWORD=A_PLATFORM_PASSWORD
```
Set up an API key with [Deepseek](https://platform.deepseek.com/usage), and generate a JWT secret by running `openssl rand -base64 24` on your device, or go to [this site](https://string-gen.vercel.app/).
The Platform Passowrd is the password to access the interface so that snoopers cannot use your API key to make arbitrary requests.
