export type StubVideoRoom = {
  videoProvider: 'STUB';
  externalRoomId: string;
  joinUrl: string;
};

export function createStubVideoRoom(bookingId: string): StubVideoRoom {
  const externalRoomId = `stub-${bookingId}`;
  return {
    videoProvider: 'STUB',
    externalRoomId,
    joinUrl: `https://meet.stub.local/rooms/${externalRoomId}`,
  };
}
