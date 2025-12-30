import asyncio
import websockets
import json

# Store connected clients
clients = {}
client_counter = 0

async def handle_udp_chat(websocket, path):
    global client_counter
    client_counter += 1
    client_id = client_counter
    
    clients[client_id] = {
        'websocket': websocket,
        'waiting_for_reply': False,
        'role': None  # 'server' or 'client'
    }
    
    try:
        print(f"New UDP connection: {client_id}")
        
        # Send welcome message
        await websocket.send(json.dumps({
            'type': 'connected',
            'message': 'Connected to UDP Chat Server (Max 1000 characters per message)'
        }))
        
        async for message in websocket:
            data = json.loads(message)
            
            if data['type'] == 'role_select':
                clients[client_id]['role'] = data['role']
                await websocket.send(json.dumps({
                    'type': 'role_confirmed',
                    'role': data['role']
                }))
                print(f"Client {client_id} selected role: {data['role']}")
                
                # Check if both roles are now connected
                server_found = any(c['role'] == 'server' for c in clients.values())
                client_found = any(c['role'] == 'client' for c in clients.values())
                
                if server_found and client_found:
                    # Notify both that they can start chatting
                    for cid, client_data in clients.items():
                        if client_data['role'] is not None:
                            await client_data['websocket'].send(json.dumps({
                                'type': 'peer_connected',
                                'message': 'Peer connected! You can start chatting.'
                            }))
            
            elif data['type'] == 'message':
                msg_text = data['message']
                role = clients[client_id]['role']
                
                # UDP: Check message length (max 1000 characters)
                if len(msg_text) > 1000:
                    await websocket.send(json.dumps({
                        'type': 'error',
                        'message': 'Message exceeds 1000 character limit for UDP'
                    }))
                    continue
                
                # Check if this client is allowed to send
                if clients[client_id]['waiting_for_reply']:
                    await websocket.send(json.dumps({
                        'type': 'error',
                        'message': 'Please wait for a reply before sending another message'
                    }))
                    continue
                
                # Find the other client (peer with opposite role)
                peer = None
                peer_id = None
                for cid, client_data in clients.items():
                    if cid != client_id and client_data['role'] != role and client_data['role'] is not None:
                        peer = client_data
                        peer_id = cid
                        break
                
                if peer:
                    try:
                        # Send message to peer (simulate UDP datagram)
                        await peer['websocket'].send(json.dumps({
                            'type': 'message',
                            'message': msg_text,
                            'sender': 'peer',
                            'length': len(msg_text)
                        }))
                        
                        # Mark this client as waiting for reply
                        clients[client_id]['waiting_for_reply'] = True
                        
                        # Allow peer to reply
                        clients[peer_id]['waiting_for_reply'] = False
                        
                        # Echo back to sender
                        await websocket.send(json.dumps({
                            'type': 'message',
                            'message': msg_text,
                            'sender': 'self',
                            'length': len(msg_text)
                        }))
                    except Exception as e:
                        print(f"Error sending to peer: {e}")
                        await websocket.send(json.dumps({
                            'type': 'error',
                            'message': 'Peer disconnected'
                        }))
                else:
                    await websocket.send(json.dumps({
                        'type': 'info',
                        'message': 'Waiting for peer to connect...'
                    }))
    
    except websockets.exceptions.ConnectionClosed:
        print(f"UDP connection closed: {client_id}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if client_id in clients:
            del clients[client_id]
            print(f"Client {client_id} removed from clients list")

async def main():
    print("WebSocket UDP Chat Server started on ws://localhost:8766")
    async with websockets.serve(handle_udp_chat, "localhost", 8766):
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    asyncio.run(main())
