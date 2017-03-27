export class Room {
  constructor(id, creator) {
    this.id = id
    this.creator = creator
    this.members = {}
  }

  addMember(member) {
    this.members = {
      ...this.members,
      [member.id]: member,
    }
  }

  removeMember(member) {
    const { [member.id]: removedMember, ...members } = this.members
    this.members = members
  }

  getObject() {
    return {
      id: this.id,
      creator: this.creator,
      members: this.members,
    }
  }
}

export class Client {
  constructor(id, username) {
    this.id = id
    this.username = username
  }
}
