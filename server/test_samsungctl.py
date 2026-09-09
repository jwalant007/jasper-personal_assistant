import socket
import base64
import time

def serialize(s, raw=False):
    if isinstance(s, str):
        s = s.encode('utf-8')
    if not raw:
        s = base64.b64encode(s)
    return bytes([len(s)]) + b'\x00' + s

def main():
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(6.0)
    s.connect(('192.168.29.229', 55000))
    print('Connected to 192.168.29.229:55000')

    payload = b'\x64\x00' + serialize('Control') + serialize('iapp.samsung') + serialize('JASPER Remote')
    packet = b'\x00\x00\x00' + serialize(payload, raw=True)
    s.send(packet)
    print('Handshake sent.')

    while True:
        try:
            hdr = s.recv(3)
            if not hdr:
                print('Socket closed')
                break
            tv_name_len = int.from_bytes(hdr[1:3], 'little')
            tv_name = s.recv(tv_name_len)
            resp_len = int.from_bytes(s.recv(2), 'little')
            resp = s.recv(resp_len)
            print('TV Name:', tv_name.decode(errors='replace'), 'Response:', resp.hex())

            if resp == b'\x64\x00\x01\x00':
                print('ACCESS GRANTED! Sending KEY_VOLUP...')
                cmd_payload = b'\x00\x00\x00' + serialize('KEY_VOLUP')
                cmd_pkt = b'\x00\x00\x00' + serialize(cmd_payload, raw=True)
                s.send(cmd_pkt)
                print('KEY_VOLUP sent!')
                time.sleep(0.5)
                # Send another one
                s.send(cmd_pkt)
                print('Second KEY_VOLUP sent!')
                break
            elif resp[0:1] == b'\x0a':
                print('Status: Waiting for authorization on TV screen...')
            elif resp == b'\x64\x00\x00\x00':
                print('Status: Access Denied!')
                break
            elif resp[0:1] == b'\x65':
                print('Status: Authorization Cancelled!')
                break
        except socket.timeout:
            print('Timeout waiting for response')
            break

    s.close()

if __name__ == '__main__':
    main()
