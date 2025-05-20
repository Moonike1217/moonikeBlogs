const { format } = require("./front-matter.cjs");

module.exports = {
  write: {
    platform: 'notion',
    notion: {
      token: process.env.NOTION_TOKEN,
      databaseId: process.env.NOTION_DATABASE_ID,
      filter: { property: 'status', select: { equals: '已发布' }}
    }
  },
  deploy: {
    platform: 'local',
    local: {
      outputDir: './source/_posts',
      filename: 'title',
      format: 'markdown',
      catalog: false,
      frontMatter: {
        enable: true,
        include: ['categories', 'tags', 'title', 'date', 'updated', 'permalink', 'cover', 'description'],
        timeFormat: true,
      },
      formatExt: './front-matter.cjs',
    }
  },
  image: {
    enable: true,
    platform: 'github',
    local: {
      outputDir: './source/images',
      prefixKey: '/images'
    },
    github: {
      token: process.env.GITHUB_TOKEN,
      user: process.env.GITHUB_USER,
      repo: process.env.GITHUB_REPO,
      branch: process.env.GITHUB_BRANCH
    }
  },
}
