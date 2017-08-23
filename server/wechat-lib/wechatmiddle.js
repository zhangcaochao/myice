import sha1 from 'sha1'
import getRawBody from 'raw-body'
import * as util from './util'
export default function (opt,reply) {
    return async function wechatMiddle(ctx,next) {
            const token = opt.token
            const {
                signature,
                nonce,
                timestamp,
                echostr
            } = ctx.query

            const str = [token, timestamp, nonce].sort().join('')
            const sha = sha1(str)
            console.log(sha === signature)
            if (ctx.method === 'GET') {
                if (sha === signature) {
                    ctx.body = echostr
                } else {
                    ctx.body = 'Failed'
                }
            }

            if (ctx.method === "POST") {
                if (sha !== signature) {
                    ctx.body = ' Failed'
                    return false
                }
                const data = await getRawBody(ctx.req, {
                    length: ctx.length,
                    limit: '1mb',
                    encoding: ctx.charset
                })
                const content = await util.parseXML(data)
                const message = util.formatMessage(content.xml)
                ctx.weixin = message
                console.log(message)
                await reply.apply(ctx, [ctx, next])
                const replyBody = ctx.body
                const msg = ctx.weixin
                console.log(replyBody)
                console.log(msg)
                const xml = util.tpl(replyBody, msg)
                ctx.status = 200
                ctx.type = 'application/xml'
                ctx.body = xml
            }

    }
}