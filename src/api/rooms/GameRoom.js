export class Room {
  constructor(id, owner) {
    this.id = id
    this.owner = owner
    this.members = {}
  }

  addMember(member) {
    this.members = { ...this.members, [member.id]: member }
  }

  removeMemberOnly(memberId) {
    delete this.members[memberId]
  }

  removeOwnerOnly() {
    const newOwner = this.members[Object.keys(this.members)[0]]
    this.owner = newOwner
    if (newOwner) delete this.members[newOwner.id]
  }

  removeMember(memberId) {
    if (memberId === this.owner.id) {
      this.removeOwnerOnly()
    } else {
      this.removeMemberOnly(memberId)
    }
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
