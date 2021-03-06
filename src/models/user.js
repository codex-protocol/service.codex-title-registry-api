import mongoose from 'mongoose'

import config from '../config'
import mongooseService from '../services/mongoose'

const schemaOptions = {
  timestamps: true, // let mongoose handle the createdAt and updatedAt fields
  usePushEach: true, // see https://github.com/Automattic/mongoose/issues/5574
}

const schema = new mongoose.Schema({
  // instead of using an auto-generated ObjectId, let's just use the user's
  //  wallet address since it's already a unique identifier
  _id: {
    type: String,
    required: true,
    lowercase: true,
    alias: 'address',
  },
  email: {
    type: String,
    default: null,
  },
  isGalleryEnabled: {
    type: Boolean,
    default: false,
  },
  faucetLastRequestedAt: {
    type: Date,
    default: null,
  },
  giveawaysParticipatedIn: [{
    ref: 'Giveaway',
    type: mongoose.Schema.Types.ObjectId,
  }],
}, schemaOptions)

schema.virtual('canRequestFaucetTokens').get(function getCanRequestFaucetTokens() {
  return config.faucet.enabled && (this.faucetLastRequestedAt === null || Date.now() - this.faucetLastRequestedAt.getTime() >= config.faucet.cooldown)
})

schema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform(document, transformedDocument) {

    // remove some mongo-specific keys that aren't necessary to send in
    //  responses
    delete transformedDocument._id
    delete transformedDocument.id

    // this is more of an internal tracking array so no need to expose this
    delete transformedDocument.giveawaysParticipatedIn

    return transformedDocument

  },
})

schema.set('toObject', {
  virtuals: true,
})

// make all queries for addresses case insensitive
function makeQueryAddressesCaseInsensitive(next) {
  const query = this.getQuery()
  if (typeof query.id === 'string') query.id = query.id.toLowerCase()
  if (typeof query._id === 'string') query._id = query._id.toLowerCase()
  if (typeof query.address === 'string') query.address = query.address.toLowerCase()
  next()
}

schema.pre('find', makeQueryAddressesCaseInsensitive)
schema.pre('count', makeQueryAddressesCaseInsensitive)
schema.pre('update', makeQueryAddressesCaseInsensitive)
schema.pre('findOne', makeQueryAddressesCaseInsensitive)
schema.pre('findOneAndRemove', makeQueryAddressesCaseInsensitive)
schema.pre('findOneAndUpdate', makeQueryAddressesCaseInsensitive)

export default mongooseService.codexRegistry.model('User', schema)
