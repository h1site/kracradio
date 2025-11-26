-- Create messages table for user-to-user messaging
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent self-messaging
  CONSTRAINT no_self_message CHECK (sender_id != recipient_id)
);

-- Create index for faster queries
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_recipient ON messages(recipient_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);
CREATE INDEX idx_messages_conversation ON messages(
  LEAST(sender_id, recipient_id),
  GREATEST(sender_id, recipient_id),
  created_at DESC
);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read messages they sent or received
CREATE POLICY "Users can read own messages"
  ON messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Policy: Users can send messages (insert)
CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Policy: Recipients can mark messages as read (update read_at)
CREATE POLICY "Recipients can mark as read"
  ON messages FOR UPDATE
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);

-- Policy: Sender can delete their own messages
CREATE POLICY "Users can delete own sent messages"
  ON messages FOR DELETE
  USING (auth.uid() = sender_id);

-- Create a view for conversations (latest message per conversation)
CREATE OR REPLACE VIEW conversations AS
SELECT DISTINCT ON (conversation_id)
  CASE
    WHEN sender_id < recipient_id THEN sender_id || '-' || recipient_id
    ELSE recipient_id || '-' || sender_id
  END as conversation_id,
  CASE
    WHEN sender_id < recipient_id THEN sender_id
    ELSE recipient_id
  END as user1_id,
  CASE
    WHEN sender_id < recipient_id THEN recipient_id
    ELSE sender_id
  END as user2_id,
  id as last_message_id,
  sender_id as last_sender_id,
  content as last_message,
  created_at as last_message_at,
  read_at
FROM messages
ORDER BY conversation_id, created_at DESC;
