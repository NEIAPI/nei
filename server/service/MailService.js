const nodemailer = require('nodemailer');
const ejs = require('ejs');
const fs = require('fs');
const path = require('path');
const wrap = require('thunkify-wrap');
const logger = require('../util/log');

class MailService {
  /**
   * send email
   * @param  {String} subject - subject
   * @param  {Array String} to - list of recipients
   * @param  {Object} options - mail options
   * @param  {String} options.content - mail content
   * @param  {String} options.name - user name
   * @param  {String} options.captcha - captcha. used for site login and nei email binding
   * @return Void
   */
  static * send(subject, to, options) {
    let config = process.appConfig.mail;
    if (config.disabled) {
      logger.debug('[%s.send] email service is disabled', this.name);
      return;
    }
    let smtpTransport = nodemailer.createTransport(config.from);
    wap(smtpTransport, ['sendMail', 'close']);

    let emailTemplate = fs.readFileSync(path.join(__dirname, '../template/email.ejs'), {encoding: 'utf8'});
    let html = ejs.render(emailTemplate, Object.assign(options, {
        content: options.content || '',
        name: options.name || '',
        captcha: options.captcha || ''
      }
    ));
    let opts = {
      from: `"${config.name}" <${config.from.auth.user}>`,
      to: to.join(', '),
      subject,
      html
    };

    try {
      logger.debug('[%s.send] send email ', this.name, opts);
      let ret = yield smtpTransport.sendMail(opts);
      if (ret.accepted && ret.accepted.length > 0) {
        logger.debug('[%s.send] send email result ', this.name, ret);
        return ret.accepted;
      } else {
        logger.debug('[%s.send] send email failed ', this.name, ret);
      }
    } catch (ex) {
      logger.error('[%s.send] send email cause exception ', this.name);
    } finally {
      smtpTransport.close();
    }
  }
}

module.exports = MailService;
