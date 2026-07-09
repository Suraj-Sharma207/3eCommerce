import React from 'react';
import BotBubble from './BotBubble';
import UserBubble from './UserBubble';

export const ChatMessage = ({ message }) => {
  return message.sender === 'bot' ? <BotBubble message={message} /> : <UserBubble message={message} />;
};

export default ChatMessage;
