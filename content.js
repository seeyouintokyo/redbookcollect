// 监听来自弹出窗口的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'extractNoteData') {
    try {
      // 检查是否在笔记页面
      if (!document.querySelector('#noteContainer')) {
        sendResponse({ 
          success: false, 
          message: '未检测到笔记内容，请确保在小红书笔记详情页打开插件' 
        });
        return true;
      }

      // 提取页面URL
      const url = window.location.href;

      // 提取作者用户名
      const usernameElement = document.querySelector('span.username');
      const username = usernameElement ? usernameElement.textContent.trim() : '';

      // 更新：提取笔记标题 - 修正选择器
      const titleElement = document.querySelector('.interaction-container .note-scroller .note-content .title');
      const title = titleElement ? titleElement.textContent.trim() : '';

      // 更新：提取笔记正文 - 修正选择器
      let noteText = '';
      const noteTextElement = document.querySelector('.interaction-container .note-scroller .note-content .desc .note-text span');
      if (noteTextElement) {
        noteText = noteTextElement.textContent.trim();
      }

      // 提取标签
      const tags = [];
      const tagElements = document.querySelectorAll('.note-text span.tag, .note-text .tag');
      tagElements.forEach(tag => {
        const tagText = tag.textContent.trim();
        if (tagText) {
          tags.push(tagText);
        }
      });

      // 更新：提取互动数据 - 修正选择器
      const interactElements = document.querySelectorAll('.interaction-container .interactions .engage-bar-container .engage-bar .input-box .interact-container .left .count');
      
      // 默认值
      let likeCount = 0;
      let collectCount = 0;
      let commentCount = 0;
      
      // 如果找到了互动数据元素，按顺序提取（第一个是点赞，第二个是收藏，第三个是评论）
      if (interactElements.length >= 3) {
        likeCount = parseInt(interactElements[0].textContent.trim(), 10) || 0;
        collectCount = parseInt(interactElements[1].textContent.trim(), 10) || 0;
        commentCount = parseInt(interactElements[2].textContent.trim(), 10) || 0;
      } else {
        // 备用方法：尝试通过父元素的类名识别不同类型的互动
        document.querySelectorAll('.interact-item').forEach(item => {
          const countElement = item.querySelector('.count');
          if (!countElement) return;
          
          const count = parseInt(countElement.textContent.trim(), 10) || 0;
          
          // 根据元素的类名或图标判断是哪种互动
          if (item.classList.contains('like') || item.querySelector('.like-icon')) {
            likeCount = count;
          } else if (item.classList.contains('collect') || item.querySelector('.collect-icon')) {
            collectCount = count;
          } else if (item.classList.contains('comment') || item.querySelector('.comment-icon')) {
            commentCount = count;
          }
        });
      }

      // 构建数据对象
      const noteData = {
        fields: {
          "url": url,
          "标题": title,
          "作者": username,
          "正文": noteText,
          "标签": tags,
          "点赞": likeCount,
          "收藏": collectCount,
          "评论": commentCount
        }
      };

      // 添加调试信息，帮助定位问题
      console.log('提取的数据:', noteData);
      
      sendResponse({ 
        success: true, 
        data: noteData 
      });
    } catch (error) {
      console.error('提取数据时出错:', error);
      sendResponse({ 
        success: false, 
        message: `提取数据时出错: ${error.message}` 
      });
    }
    return true;
  }
}); 