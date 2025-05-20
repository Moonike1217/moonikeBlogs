const { matterMarkdownAdapter } = require('@elog/cli');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
dayjs.extend(utc); dayjs.extend(timezone);

/**
 * 自定义 Front Matter：将 date 加 8 小时后写入
 * @param {DocDetail} doc
 * @param {ImageClient} imageClient
 * @returns {Promise<DocDetail>}
 */
async function format(doc, imageClient) {
  const docBody = doc.body;
  console.log(docBody);
  // 1. 获取原始信息
  const rawDate = doc.properties.date;       
  const rawUpdated = doc.properties.updated;                  
  const rawCategories = doc.properties.categories;
  const rawMermaid = doc.properties.mermaid;

  // 2. 计算东八区日期
  const adjustedDate = dayjs.utc(rawDate)                           
    .tz('Asia/Shanghai')                                        
    .format('YYYY-MM-DDTHH:mm:ss');                       
  const adjustedUpdated = dayjs.utc(rawUpdated)                           
    .tz('Asia/Shanghai')                                        
    .format('YYYY-MM-DDTHH:mm:ss');          
    
  // 3. 拆解目录 
  // 确保categories是数组格式
  const cats = Array.isArray(rawCategories) ? rawCategories : [rawCategories];
  // 假设每个分类可能是以/分隔的多级分类，转换为数组格式
  let formattedCategories = '';
  cats.forEach(category => {
    const subCategories = String(category).split('/');
    if (subCategories.length > 1) {
      formattedCategories += `\n  - [${subCategories.join(', ')}]`;
    } else {
      formattedCategories += `\n  - ${category}`;
    }
  });
  formattedCategories = formattedCategories || '\n  - [未分类]';

  // 手动拼装 YAML Front Matter
  const fmLines = [
    '---',
    `title: ${doc.properties.title}`,
    `date: ${adjustedDate}`,
    `updated: ${adjustedUpdated}`,
    `categories: ${formattedCategories}`,
    `cover: ${doc.properties.cover || ''}`
  ];
  if (rawMermaid === true || doc.body_original.includes('```mermaid')) {
    fmLines.push('mermaid: true');
  }
  fmLines.push('---', '');
  const fm = fmLines.join('\n');

  // 合并 body 原文
  doc.body = fm + docBody;           
  console.log(doc.body);
  return doc;
}

module.exports = { format };
