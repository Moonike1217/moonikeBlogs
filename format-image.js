const { matterMarkdownAdapter } = require('@elog/cli')

/**
 * 自定义文档处理器
 * @param {DocDetail} doc doc的类型定义为 DocDetail
 * @param {any} imageClient 图床下载器
 * @return {Promise<DocDetail>} 返回处理后的文档对象
 */
const format = async (doc, imageClient) => {
  const cover = doc.properties.cover
  // 将 cover 字段中的 notion 图片下载到本地
  if (imageClient)  {
    // 只有启用图床平台image.enable=true时，imageClient才能用，否则请自行实现图片上传
    const url = await imageClient.uploadImageFromUrl(cover, doc)
    // cover链接替换为本地图片
    doc.properties.cover = url
  }
  
  // 自定义front matter格式
  const frontMatter = generateCustomFrontMatter(doc.properties);
  
  // 使用默认适配器获取内容部分
  const defaultBody = matterMarkdownAdapter(doc);
  
  // 从默认内容中提取正文部分（不含front matter）
  const contentRegex = /^---\n[\s\S]*?\n---\n([\s\S]*)$/;
  const contentMatch = defaultBody.match(contentRegex);
  const content = contentMatch ? contentMatch[1] : '';
  
  // 合并自定义front matter和内容
  doc.body = frontMatter + content;
  
  return doc;
};

/**
 * 生成自定义front matter
 * @param {Object} properties 文档属性
 * @returns {string} 格式化的front matter
 */
function generateCustomFrontMatter(properties) {
  const { title, categories, tags, date, updated } = properties;
  
  let frontMatter = '---\n';
  
  // 添加标题
  frontMatter += `title: ${title || 'Untitled'}\n`;
  
  // 添加分类
  frontMatter += 'categories:\n';
  if (categories && categories.length > 0) {
    // 确保categories是数组格式
    const cats = Array.isArray(categories) ? categories : [categories];
    // 假设每个分类可能是以/分隔的多级分类，转换为数组格式
    cats.forEach(category => {
      const subCategories = String(category).split('/');
      if (subCategories.length > 1) {
        frontMatter += `  - [${subCategories.join(', ')}]\n`;
      } else {
        frontMatter += `  - ${category}\n`;
      }
    });
  } else {
    frontMatter += '  - [未分类]\n';
  }
  
  // 添加标签
  frontMatter += 'tags:\n';
  if (tags && tags.length > 0) {
    // 确保tags是数组格式
    const tagArray = Array.isArray(tags) ? tags : [tags];
    tagArray.forEach(tag => {
      frontMatter += `  - ${tag}\n`;
    });
  } else {
    frontMatter += '  - null\n';
  }
  
  if (date) {
    const localDate = new Date(new Date(date).getTime() + 8 * 60 * 60 * 1000);
    const dateStr = localDate.toISOString().replace('T', ' ').substring(0, 19);
    frontMatter += `date: ${dateStr}\n`;
  } else {
    const now = new Date(new Date().getTime() + 8 * 60 * 60 * 1000);
    const nowStr = now.toISOString().replace('T', ' ').substring(0, 19);
    frontMatter += `date: ${nowStr}\n`;
  }
  
  if (updated) {
    const localUpdated = new Date(new Date(updated).getTime() + 8 * 60 * 60 * 1000);
    const updatedStr = localUpdated.toISOString().replace('T', ' ').substring(0, 19);
    frontMatter += `updated: ${updatedStr}\n`;
  } else {
    const now = new Date(new Date().getTime() + 8 * 60 * 60 * 1000);
    const nowStr = now.toISOString().replace('T', ' ').substring(0, 19);
    frontMatter += `updated: ${nowStr}\n`;
  }
  

  
  frontMatter += '---\n';
  return frontMatter;
}

module.exports = {
  format,
};