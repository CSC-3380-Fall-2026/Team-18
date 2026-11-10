import { supabase } from './supabase'

export type Message = {
  id: string
  listing_id: string
  sender_id: string
  receiver_id: string
  body: string
  read: boolean
  created_at: string
}

// Who you're chatting with, and about which item
export type ChatTarget = {
  listingId: string
  listingTitle: string
  otherUserId: string
  otherName: string
}

export type Conversation = ChatTarget & {
  lastMessage: string
  lastAt: string
  unread: number
  photo: string | null
}

// All messages between me and one other person about one listing, oldest first.
// Security rules already hide anything I'm not part of.
export async function fetchThread(listingId: string, otherUserId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('listing_id', listingId)
    .or(`sender_id.eq.${otherUserId},receiver_id.eq.${otherUserId}`)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Could not load messages:', error.message)
    return []
  }
  return (data ?? []) as Message[]
}

// sender_id fills itself in from the logged-in user
export async function sendMessage(listingId: string, receiverId: string, body: string) {
  return supabase.from('messages').insert({ listing_id: listingId, receiver_id: receiverId, body })
}

// Mark everything the other person sent me in this chat as read
export async function markThreadRead(listingId: string, otherUserId: string, myId: string) {
  await supabase
    .from('messages')
    .update({ read: true })
    .eq('listing_id', listingId)
    .eq('sender_id', otherUserId)
    .eq('receiver_id', myId)
    .eq('read', false)
}

type MessageWithListing = Message & {
  listings: { title: string; photos: string[] | null } | null
}

// My inbox: one row per (listing, other person), newest conversation first
export async function fetchConversations(myId: string): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*, listings(title, photos)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Could not load conversations:', error.message)
    return []
  }

  const rows = (data ?? []) as MessageWithListing[]
  const byChat = new Map<string, Conversation>()

  for (const row of rows) {
    const otherUserId = row.sender_id === myId ? row.receiver_id : row.sender_id
    const key = `${row.listing_id}:${otherUserId}`
    const isUnread = row.receiver_id === myId && !row.read

    const existing = byChat.get(key)
    if (existing) {
      if (isUnread) existing.unread += 1
      continue
    }

    // Rows are newest first, so the first one we see is the latest message
    byChat.set(key, {
      listingId: row.listing_id,
      listingTitle: row.listings?.title ?? 'Listing',
      photo: row.listings?.photos?.[0] ?? null,
      otherUserId,
      otherName: 'LSU Student',
      lastMessage: row.body,
      lastAt: row.created_at,
      unread: isUnread ? 1 : 0,
    })
  }

  // Fill in names from profiles in one request
  const conversations = [...byChat.values()]
  const ids = [...new Set(conversations.map((c) => c.otherUserId))]
  if (ids.length > 0) {
    const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', ids)
    const names = new Map((profiles ?? []).map((p: { id: string; full_name: string | null }) => [p.id, p.full_name]))
    for (const c of conversations) c.otherName = names.get(c.otherUserId) || 'LSU Student'
  }

  return conversations
}
