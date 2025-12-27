import React, { useState, useRef, useEffect } from 'react';
import { Monitor, Smartphone, Tablet, Upload, X, Copy, Download, Check } from 'lucide-react';

export default function LinkedInPreviewer() {
  const DEFAULT_PROFILE = {
    name: 'Michel Lieben 🧠',
    headline: 'Founder / CEO @ ColdIQ | Scale Outbound with AI & Tech 👉 coldiq.com',
    photoUrl: '/michel-profile.jpg'
  };

  const GENERIC_AVATAR = '/default-avatar.png';

  const DEVICE_CONFIG = {
    mobile: {
      maxLines: 2,
      maxHeight: 56,
      containerWidth: 340,
      fontSize: 14,
      lineHeight: 1.4
    },
    ipad: {
      maxLines: 2,
      maxHeight: 56,
      containerWidth: 440,
      fontSize: 14,
      lineHeight: 1.4
    },
    desktop: {
      maxLines: 2,
      maxHeight: 56,
      containerWidth: 540,
      fontSize: 14,
      lineHeight: 1.4
    }
  };

  const [postText, setPostText] = useState('');
  const [authorName, setAuthorName] = useState(() => {
    if (typeof document !== 'undefined') {
      return document.cookie.split('; ').find(row => row.startsWith('li_author_name='))?.split('=')[1] || '';
    }
    return '';
  });
  const [authorHeadline, setAuthorHeadline] = useState(() => {
    if (typeof document !== 'undefined') {
      return document.cookie.split('; ').find(row => row.startsWith('li_author_headline='))?.split('=')[1] || '';
    }
    return '';
  });
  const [customProfilePhoto, setCustomProfilePhoto] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem('li_profile_photo') || '';
    }
    return '';
  });
  const [charCount, setCharCount] = useState(0);
  const [lineCount, setLineCount] = useState(0);
  const [viewMode, setViewMode] = useState('mobile');
  const [darkMode, setDarkMode] = useState(false);
  const [mediaType, setMediaType] = useState(null); // 'image', 'document', 'poll'
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploadedDocument, setUploadedDocument] = useState(null);
  const [documentPages, setDocumentPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [documentTitle, setDocumentTitle] = useState('');
  const [showFullText, setShowFullText] = useState(false);
  const [hasExpandedOnce, setHasExpandedOnce] = useState(false);
  const [useProfile, setUseProfile] = useState(() => {
    if (typeof document !== 'undefined') {
      return document.cookie.split('; ').find(row => row.startsWith('li_use_profile='))?.split('=')[1] === 'true';
    }
    return false;
  });
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [isTextOverflowing, setIsTextOverflowing] = useState(false);
  const textPreviewRef = useRef(null);
  const fileInputRef = useRef(null);
  const profilePhotoInputRef = useRef(null);
  const documentInputRef = useRef(null);
  const previewCardRef = useRef(null);

  const SAMPLE_POST = `I discovered something surprising about LinkedIn posts.

Most people think longer posts perform worse.

But here's the truth: engagement depends on your hook, not length.

The key is those first 3-5 lines that show before "see more".

If your hook doesn't grab attention, nobody clicks to read more.

Test this yourself - write a compelling first paragraph, then add your full story after.

What's been your experience with post length?`;

  useEffect(() => {
    const config = DEVICE_CONFIG[viewMode];
    if (textPreviewRef.current) {
      setIsTextOverflowing(textPreviewRef.current.scrollHeight > config.maxHeight);
    }
  }, [postText, viewMode, showFullText]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.cookie = `li_author_name=${authorName}; max-age=31536000; path=/`;
      document.cookie = `li_author_headline=${authorHeadline}; max-age=31536000; path=/`;
      document.cookie = `li_use_profile=${useProfile}; max-age=31536000; path=/`;
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      if (customProfilePhoto) {
        localStorage.setItem('li_profile_photo', customProfilePhoto);
      } else {
        localStorage.removeItem('li_profile_photo');
      }
    }
  }, [authorName, authorHeadline, useProfile, customProfilePhoto]);

  const getDisplayName = () => useProfile && authorName ? authorName : DEFAULT_PROFILE.name;
  const getDisplayHeadline = () => useProfile && authorHeadline ? authorHeadline : DEFAULT_PROFILE.headline;
  const getDisplayPhoto = () => {
    if (!useProfile) {
      return DEFAULT_PROFILE.photoUrl;
    }
    if (customProfilePhoto) {
      return customProfilePhoto;
    }
    return GENERIC_AVATAR;
  };

  const handleTextChange = (e) => {
    const text = e.target.value;
    setPostText(text);
    setCharCount(text.length);
    setLineCount(text.split('\n').length);
    setShowFullText(false);
    setHasExpandedOnce(false);
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map(file => URL.createObjectURL(file));
    setUploadedImages(prev => [...prev, ...newImages].slice(0, 4));
    setMediaType('image');
  };

  const handleDocumentUpload = async (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setUploadedDocument(file);
      setMediaType('document');
      // Set document title without .pdf extension
      const fileName = file.name.replace(/\.pdf$/i, '');
      setDocumentTitle(fileName);
      
      try {
        // Dynamically load PDF.js if not already loaded
        if (!window['pdfjs-dist/build/pdf']) {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
          document.head.appendChild(script);
          
          await new Promise((resolve) => {
            script.onload = resolve;
          });
        }
        
        // Set worker
        const pdfjsLib = window['pdfjs-dist/build/pdf'];
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        
        // Load PDF
        const fileUrl = URL.createObjectURL(file);
        const loadingTask = pdfjsLib.getDocument(fileUrl);
        const pdf = await loadingTask.promise;
        
        // Render all pages
        const pagePromises = [];
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          pagePromises.push(
            (async () => {
              const page = await pdf.getPage(pageNum);
              const scale = 2;
              const viewport = page.getViewport({ scale });
              
              const canvas = document.createElement('canvas');
              const context = canvas.getContext('2d');
              canvas.width = viewport.width;
              canvas.height = viewport.height;
              
              await page.render({
                canvasContext: context,
                viewport: viewport
              }).promise;
              
              return {
                pageNumber: pageNum,
                thumbnail: canvas.toDataURL('image/png')
              };
            })()
          );
        }
        
        const pages = await Promise.all(pagePromises);
        setDocumentPages(pages);
        setCurrentPage(0);
        
      } catch (error) {
        console.error('Error loading PDF:', error);
        // Create placeholder pages as fallback
        const placeholderPages = Array.from({ length: 5 }, (_, i) => ({
          pageNumber: i + 1,
          thumbnail: null
        }));
        setDocumentPages(placeholderPages);
        setCurrentPage(0);
      }
    }
  };

  const handleMediaTypeSelect = (type) => {
    // If same type and already has content, trigger file input to replace
    if (mediaType === type) {
      if (type === 'image') {
        fileInputRef.current?.click();
      } else if (type === 'document') {
        documentInputRef.current?.click();
      }
      return;
    }
    
    // Clear previous media
    setUploadedImages([]);
    setUploadedDocument(null);
    setDocumentPages([]);
    setCurrentPage(0);
    
    setMediaType(type);
    
    // Trigger file input for respective type
    if (type === 'image') {
      fileInputRef.current?.click();
    } else if (type === 'document') {
      documentInputRef.current?.click();
    }
  };


  const handleProfilePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomProfilePhoto(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (index) => {
    const newImages = uploadedImages.filter((_, i) => i !== index);
    setUploadedImages(newImages);
    if (newImages.length === 0) {
      setMediaType(null);
    }
  };

  const removeMedia = () => {
    setMediaType(null);
    setUploadedImages([]);
    setUploadedDocument(null);
    setDocumentPages([]);
    setCurrentPage(0);
    setDocumentTitle('');
    
    // Clear file input values to allow re-uploading the same file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (documentInputRef.current) {
      documentInputRef.current.value = '';
    }
  };

const nextPage = (e) => {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  
  // Save scroll position before state change
  const scrollPos = previewCardRef.current?.scrollTop || 0;
  
  if (currentPage < documentPages.length - 1) {
    setCurrentPage(currentPage + 1);
    
    // Restore scroll position immediately after React updates
    requestAnimationFrame(() => {
      if (previewCardRef.current) {
        previewCardRef.current.scrollTop = scrollPos;
      }
    });
  }
};

const prevPage = (e) => {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  
  // Save scroll position before state change
  const scrollPos = previewCardRef.current?.scrollTop || 0;
  
  if (currentPage > 0) {
    setCurrentPage(currentPage - 1);
    
    // Restore scroll position immediately after React updates
    requestAnimationFrame(() => {
      if (previewCardRef.current) {
        previewCardRef.current.scrollTop = scrollPos;
      }
    });
  }
};

  const loadSamplePost = () => {
    setPostText(SAMPLE_POST);
    setCharCount(SAMPLE_POST.length);
    setLineCount(SAMPLE_POST.split('\n').length);
    setShowFullText(false);
    setHasExpandedOnce(false);
  };

  const clearPost = () => {
    setPostText('');
    setCharCount(0);
    setLineCount(0);
    setShowFullText(false);
    setHasExpandedOnce(false);
    setMediaType(null);
    setUploadedImages([]);
    setUploadedDocument(null);
    setDocumentPages([]);
    setCurrentPage(0);
    setDocumentTitle('');
    removeMedia();
  };

 

  const handleSeeMore = () => {
    setShowFullText(true);
    setHasExpandedOnce(true);
  };

  const handleSeeLess = () => {
    setShowFullText(false);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(postText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const autoSpaceText = (text) => {
  if (!text) return text;
  
  // First, split by newlines and trim
  let lines = text.split('\n').map(line => line.trim());
  
  // Remove empty lines initially
  lines = lines.filter(line => line.length > 0);
  
  // Step 1: Split mashed-together list items (→, •, ↳ only, not -)
  const processedLines = [];
  
  for (let line of lines) {
    // Check if line has multiple list symbols mashed together
    const arrowCount = (line.match(/→/g) || []).length;
    const bulletCount = (line.match(/•/g) || []).length;
    const hookArrowCount = (line.match(/↳/g) || []).length;
    
    if (arrowCount > 1 || bulletCount > 1 || hookArrowCount > 1) {
      // Split by list symbols while keeping the symbol with the text
      const parts = line.split(/(→|•|↳)/).filter(part => part.trim());
      
      let currentItem = '';
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i].trim();
        
        if (part === '→' || part === '•' || part === '↳') {
          // Push previous item if exists
          if (currentItem.trim()) {
            processedLines.push(currentItem.trim());
          }
          // Start new item
          currentItem = part;
        } else {
          // Add text to current item
          if (currentItem && !currentItem.endsWith(' ')) {
            currentItem += ' ';
          }
          currentItem += part;
        }
      }
      // Push last item
      if (currentItem.trim()) {
        processedLines.push(currentItem.trim());
      }
    } else {
      processedLines.push(line);
    }
  }
  
  // Step 2: Apply spacing rules
  const result = [];
  
  for (let i = 0; i < processedLines.length; i++) {
    const currentLine = processedLines[i];
    const nextLine = processedLines[i + 1];
    const prevLine = processedLines[i - 1];
    
    // Check if line is a section header (starts with emoji number)
    const isSectionHeader = /^[0-9]️⃣/.test(currentLine);
    const nextIsSectionHeader = nextLine && /^[0-9]️⃣/.test(nextLine);
    const prevWasSectionHeader = prevLine && /^[0-9]️⃣/.test(prevLine);
    
    // Check if line is a list item (starts with →, •, or ↳)
    const isListItem = /^[→•↳]/.test(currentLine);
    const nextIsListItem = nextLine && /^[→•↳]/.test(nextLine);
    const prevWasListItem = prevLine && /^[→•↳]/.test(prevLine);
    
    // Check if in hook (first 2 lines)
    const isInHook = i < 2;
    
    // Add current line
    result.push(currentLine);
    
    // Decide if we need a blank line after this line
    if (i < processedLines.length - 1) {
      if (isInHook) {
        // No blank line in hook
        continue;
      } else if (isSectionHeader) {
        // Blank line after section header
        result.push('');
      } else if (nextIsSectionHeader) {
        // Blank line before section header
        result.push('');
      } else if (isListItem && nextIsListItem) {
        // Keep list items together
        continue;
      } else if (isListItem && !nextIsListItem) {
        // Blank line after list ends
        result.push('');
      } else if (!isListItem && !nextIsListItem && !prevWasSectionHeader) {
        // Blank line between regular paragraphs (but not right after section header)
        result.push('');
      }
    }
  }
  
  return result.join('\n');
};

  const applyAutoSpacing = () => {
    const spacedText = autoSpaceText(postText);
    setPostText(spacedText);
    setCharCount(spacedText.length);
    setLineCount(spacedText.split('\n').length);
  };

  

  const downloadAsImage = async () => {
    if (!previewCardRef.current) return;
    
    setDownloading(true);
    
    // Store current state
    const wasCollapsed = !showFullText;
    
    try {
      // Force expanded state for download
      setShowFullText(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Hide scrollbar for download
      const originalOverflow = previewCardRef.current.style.overflow;
      const originalMaxHeight = previewCardRef.current.style.maxHeight;
      previewCardRef.current.style.overflow = 'visible';
      previewCardRef.current.style.maxHeight = 'none';
      
      // Use modern-screenshot library which handles CORS better
      const modernScreenshot = await import('https://cdn.jsdelivr.net/npm/modern-screenshot@4.4.39/+esm');
      
      // Add temporary padding to bottom for watermark space
      const originalPadding = previewCardRef.current.style.paddingBottom;
      previewCardRef.current.style.paddingBottom = '60px';
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const dataUrl = await modernScreenshot.domToPng(previewCardRef.current, {
        quality: 1,
        scale: 2,
        backgroundColor: darkMode ? '#1b1f23' : '#ffffff',
      });
      
      // Restore original styles
      previewCardRef.current.style.paddingBottom = originalPadding;
      previewCardRef.current.style.overflow = originalOverflow;
      previewCardRef.current.style.maxHeight = originalMaxHeight;
      
      // Create image and add watermark
      const img = new Image();
      img.src = dataUrl;
      
      await new Promise((resolve) => {
        img.onload = resolve;
      });
      
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      
      // Add watermark at bottom
      ctx.font = '24px Arial';
      ctx.fillStyle = 'rgba(128, 128, 128, 0.4)';
      ctx.textAlign = 'center';
      ctx.fillText('Created with ColdIQ.com', canvas.width / 2, canvas.height - 25);
      
      const link = document.createElement('a');
      link.download = 'linkedin-post-preview.png';
      link.href = canvas.toDataURL();
      link.click();
      
      // Restore state to collapsed if it was collapsed
      if (wasCollapsed) {
        setShowFullText(false);
      }
    } catch (err) {
      console.error('Failed to download:', err);
    } finally {
      setDownloading(false);
    }
  };

  const getPreviewContainerClass = () => {
    return `transition-all duration-300`;
  };

  const getPreviewStyle = () => {
    const config = DEVICE_CONFIG[viewMode];
    return {
      width: `${config.containerWidth}px`,
      maxWidth: '100%'
    };
  };

  const DocumentCarousel = () => {
    if (!uploadedDocument || documentPages.length === 0) return null;

    const currentPageData = documentPages[currentPage];

    return (
      <div className="mt-3 -mx-3">
        {/* Document title bar */}
        <div className={`px-6 py-2 text-sm font-medium ${
          darkMode ? 'bg-[#38434f] text-[#e8e6e3]' : 'bg-gray-100 text-gray-900'
        }`}>
          <input
            type="text"
            value={documentTitle}
            onChange={(e) => setDocumentTitle(e.target.value)}
            className={`bg-transparent border-0 focus:outline-none w-full ${
              darkMode ? 'text-[#e8e6e3]' : 'text-gray-900'
            }`}
          />
          <span className={`text-xs ${darkMode ? 'text-[#b4b2ab]' : 'text-gray-600'}`}>
            {documentPages.length} {documentPages.length === 1 ? 'page' : 'pages'}
          </span>
        </div>

        {/* Carousel */}
        <div className="relative w-full bg-white">
          <div className="flex h-full items-center justify-center">
            {currentPageData?.thumbnail ? (
              <img 
                src={currentPageData.thumbnail} 
                alt={`Page ${currentPageData.pageNumber}`}
                className="w-full object-contain"
                style={{ maxHeight: '500px' }}
              />
            ) : (
              <div className="text-center p-8">
                <svg className="w-16 h-16 mx-auto mb-4 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
                </svg>
                <p className="text-sm font-medium text-gray-900">{uploadedDocument.name}</p>
              </div>
            )}
          </div>
          
          {/* Navigation arrows */}
{currentPage > 0 && (
  <button
    type="button"
    onClick={prevPage}
    onMouseDown={(e) => e.preventDefault()}
    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors z-10 border border-gray-200"
  >
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
    </svg>
  </button>
)}

{currentPage < documentPages.length - 1 && (
  <button
    type="button"
    onClick={nextPage}
    onMouseDown={(e) => e.preventDefault()}
    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors z-10 border border-gray-200"
  >
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
    </svg>
  </button>
)}

          {/* Page counter */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/70 text-white text-xs rounded-full">
            {currentPage + 1} / {documentPages.length}
          </div>
        </div>
      </div>
    );
  };

  const ImageGrid = () => {
    if (uploadedImages.length === 0) return null;
    
    const gridClass = uploadedImages.length === 1 
      ? 'grid-cols-1' 
      : uploadedImages.length === 2 
      ? 'grid-cols-2' 
      : uploadedImages.length === 3
      ? 'grid-cols-2'
      : 'grid-cols-2';

    return (
      <div className={`grid ${gridClass} gap-1`}>
        {uploadedImages.map((img, idx) => (
          <div 
            key={idx} 
            className={`relative ${uploadedImages.length === 3 && idx === 0 ? 'col-span-2' : ''}`}
          >
            <img 
              src={img} 
              alt={`Upload ${idx + 1}`} 
              className="w-full object-contain rounded"
              style={{ 
                maxHeight: uploadedImages.length === 1 ? 'none' : '300px',
                height: uploadedImages.length === 1 ? 'auto' : undefined
              }}
            />
          </div>
        ))}
      </div>
    );
  };

  const PostContent = () => {
    const config = DEVICE_CONFIG[viewMode];
    const maxHeight = config.maxHeight;
    
    if (!postText && !mediaType) {
      return <span className={`italic ${darkMode ? 'text-[#7a7a7a]' : 'text-gray-400'}`}>Start typing to see your post preview...</span>;
    }

    const lines = postText.split('\n');
    
    return (
      <div className="relative">
        <div 
          ref={textPreviewRef}
          className={`text-sm leading-relaxed whitespace-pre-wrap break-words overflow-hidden ${
            darkMode ? 'text-[#e8e6e3]' : 'text-gray-900'
          }`}
          style={{
            fontSize: `${config.fontSize}px`,
            lineHeight: config.lineHeight,
            maxHeight: showFullText ? 'none' : `${maxHeight}px`
          }}
        >
          {lines.map((line, idx) => (
            <React.Fragment key={idx}>
              {line || '\u00A0'}
              {idx < lines.length - 1 && '\n'}
            </React.Fragment>
          ))}
        </div>
        
         {!showFullText && isTextOverflowing && (
          <div className="mt-1">
            <button 
              onClick={handleSeeMore}
              className={`text-sm ${
                darkMode ? 'text-[#9a989f] hover:text-[#e8e6e3]' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              ... more
            </button>
          </div>
        )}

        {mediaType === 'image' && uploadedImages.length > 0 && (
          <div className={postText ? "mt-3" : ""}>
            <ImageGrid />
          </div>
        )}
        
        {mediaType === 'document' && (
          <div className={postText ? "" : "-mt-3"}>
            <DocumentCarousel />
          </div>
        )}
        

        {showFullText && hasExpandedOnce && (
          <div className="mt-2">
            <button 
              onClick={handleSeeLess}
              className={`text-sm ${
                darkMode ? 'text-[#9a989f] hover:text-[#e8e6e3]' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              ...less
            </button>
          </div>
        )}
      </div>
    );
  };

  const LinkedInPost = () => (
    <div ref={previewCardRef} className={`border rounded-lg overflow-y-auto shadow-sm max-h-[800px] ${
      darkMode 
        ? 'bg-[#1b1f23] border-[#38434f]' 
        : 'bg-white border-gray-200'
    }`}>
      <div className="p-3 flex items-start gap-2">
        <div className="w-12 h-12 rounded-full flex-shrink-0 overflow-hidden bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
          {getDisplayPhoto() ? (
            <img 
              src={getDisplayPhoto()} 
              alt={getDisplayName()}
              className="w-full h-full object-cover"
              style={getDisplayPhoto() === GENERIC_AVATAR ? { transform: 'scale(1.3)' } : {}}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = `<span class="text-white font-semibold text-lg">${getDisplayName().charAt(0).toUpperCase()}</span>`;
              }}
            />
          ) : (
            <span className="text-white font-semibold text-lg">
              {getDisplayName().charAt(0).toUpperCase()}
            </span>
          )}
        </div>
      <div className="flex-1 min-w-0">
          <div className={`font-semibold text-sm truncate hover:underline cursor-pointer ${
            darkMode ? 'text-[#e8e6e3] hover:text-[#70b5f9]' : 'text-gray-900 hover:text-blue-600'
          }`}>
            {getDisplayName()}
          </div>
          <div className={`text-xs truncate ${
            darkMode ? 'text-[#b4b2ab]' : 'text-gray-600'
          }`}>
            {getDisplayHeadline()}
          </div>
          <div className={`text-xs flex items-center gap-1 mt-0.5 ${
            darkMode ? 'text-[#9a989f]' : 'text-gray-500'
          }`}>
            <span>21m</span>
            <span>•</span>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1a7 7 0 107 7 7 7 0 00-7-7zM3 8a5 5 0 011-3l.5.5A1.5 1.5 0 105 4.5L4.5 4a5 5 0 118 6.5l-.5-.5a1.5 1.5 0 00-2-2l-.5.5a5 5 0 01-6.5-1z"/>
            </svg>
          </div>
        </div>
        <div className="flex gap-1">
          <button 
            onClick={copyToClipboard}
            disabled={!postText}
            className={`rounded p-1.5 disabled:opacity-40 disabled:cursor-not-allowed ${
              darkMode 
                ? 'text-[#b4b2ab] hover:bg-[#38434f]' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="Copy post text"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
          <button className={`rounded p-1.5 ${
            darkMode 
              ? 'text-[#b4b2ab] hover:bg-[#38434f]' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14 12a2 2 0 11-2-2 2 2 0 012 2zM4 10a2 2 0 102 2 2 2 0 00-2-2zm16 0a2 2 0 102 2 2 2 0 00-2-2z"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="px-3 pb-2">
        <PostContent />
      </div>

      <div className={`px-3 py-2 flex items-center justify-between text-xs ${
        darkMode ? 'text-[#9a9a9a]' : 'text-gray-500'
      }`}>
        <div className="flex items-center gap-1">
          <div className="flex -space-x-1">
            <img 
              src="/linkedin-like-icon.svg" 
              alt="Like" 
              className="w-4 h-4 border rounded-full"
              style={{ borderColor: darkMode ? '#1b1f23' : 'white' }}
            />
            <img 
              src="/linkedin-insightful-icon.svg" 
              alt="Insightful" 
              className="w-4 h-4 border rounded-full"
              style={{ borderColor: darkMode ? '#1b1f23' : 'white' }}
            />
            <img 
              src="/linkedin-love-icon.svg" 
              alt="Love" 
              className="w-4 h-4 border rounded-full"
              style={{ borderColor: darkMode ? '#1b1f23' : 'white' }}
            />
          </div>
          <span className={`cursor-pointer ${
            darkMode ? 'hover:text-[#70b5f9] hover:underline' : 'hover:text-blue-600 hover:underline'
          }`}>83</span>
        </div>
        <div className="flex gap-2">
          <span className={`cursor-pointer ${
            darkMode ? 'hover:text-[#70b5f9] hover:underline' : 'hover:text-blue-600 hover:underline'
          }`}>23 comments</span>
          <span>•</span>
          <span className={`cursor-pointer ${
            darkMode ? 'hover:text-[#70b5f9] hover:underline' : 'hover:text-blue-600 hover:underline'
          }`}>4 reposts</span>
        </div>
      </div>

     
    </div>
  );

  return (
    <div className={`min-h-screen p-4 md:p-8 ${darkMode ? 'bg-[#000000]' : 'bg-gray-50'}`}>
      <div className={`max-w-7xl mx-auto ${darkMode ? 'text-[#e8e6e3]' : ''}`}>
        <div className="text-center mb-6">
          <h1 className={`text-3xl md:text-4xl font-bold mb-2 ${darkMode ? 'text-[#e8e6e3]' : 'text-gray-900'}`}>
            LinkedIn Post Preview Generator
          </h1>
          <p className={darkMode ? 'text-[#b4b2ab]' : 'text-gray-600'}>See exactly how your post will look with accurate line-based truncation</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className={`rounded-xl shadow-sm border p-6 ${
            darkMode ? 'bg-[#1b1f23] border-[#38434f]' : 'bg-white border-gray-200'
          }`}>
            <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-[#e8e6e3]' : 'text-gray-900'}`}>Post Content</h2>
            
            <div className="space-y-4">
             <div className={`p-3 rounded-lg border ${
  darkMode ? 'bg-[#1b1f23] border-[#38434f]' : 'bg-white border-gray-200'
}`}>
  <div className="flex items-center gap-2.5">
    <button
      id="use-profile-toggle"
      onClick={() => setUseProfile(!useProfile)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${
        useProfile ? 'bg-blue-600' : darkMode ? 'bg-[#545d69]' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
          useProfile ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
    
    <label 
      htmlFor="use-profile-toggle"
      className={`text-sm cursor-pointer ${
        darkMode ? 'text-[#b4b2ab]' : 'text-gray-600'
      }`}
    >
      Use your profile
    </label>
  </div>

  {useProfile && (
    <div className="mt-3 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={`block text-xs font-medium mb-1.5 ${
            darkMode ? 'text-[#b4b2ab]' : 'text-gray-700'
          }`}>
            Name
          </label>
          <input
            type="text"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:shadow-lg focus:shadow-blue-500/20 transition-shadow ${
  darkMode 
    ? 'bg-[#38434f] border-[#545d69] text-[#e8e6e3] placeholder-[#7a7a7a]' 
    : 'bg-gray-50 border-gray-300 text-gray-900'
}`}
            placeholder="Your Name"
          />
        </div>

        <div>
          <label className={`block text-xs font-medium mb-1.5 ${
            darkMode ? 'text-[#b4b2ab]' : 'text-gray-700'
          }`}>
            Headline
          </label>
          <input
            type="text"
            value={authorHeadline}
            onChange={(e) => setAuthorHeadline(e.target.value)}
            className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:shadow-lg focus:shadow-blue-500/20 transition-shadow ${
  darkMode 
    ? 'bg-[#38434f] border-[#545d69] text-[#e8e6e3] placeholder-[#7a7a7a]' 
    : 'bg-gray-50 border-gray-300 text-gray-900'
}`}
            placeholder="Your Headline"
          />
        </div>
      </div>

      <div>
  <label className={`block text-xs font-medium mb-1.5 ${
    darkMode ? 'text-[#b4b2ab]' : 'text-gray-700'
  }`}>
    Profile Photo
  </label>
  
  <input
    ref={profilePhotoInputRef}
    type="file"
    accept="image/*"
    onChange={handleProfilePhotoUpload}
    className="hidden"
  />
  
  <div className="flex items-center gap-3 w-full">
    <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center flex-shrink-0">
  <img 
    src={getDisplayPhoto()} 
    alt="Profile" 
    className="w-full h-full object-cover"
    style={getDisplayPhoto() === GENERIC_AVATAR ? { transform: 'scale(1.3)' } : {}}
    onError={(e) => {
      e.target.style.display = 'none';
      e.target.parentElement.innerHTML = `<span class="text-white font-semibold text-lg">${getDisplayName().charAt(0).toUpperCase()}</span>`;
    }}
  />
</div>
    
    <div className="flex gap-2 flex-1">
      <button
        onClick={() => profilePhotoInputRef.current?.click()}
        className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          darkMode
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {customProfilePhoto ? 'Change Photo' : 'Upload Photo'}
      </button>
      {customProfilePhoto && (
        <button
          onClick={() => setCustomProfilePhoto('')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            darkMode
              ? 'bg-red-600/10 text-red-400 hover:bg-red-600/20'
              : 'bg-red-50 text-red-600 hover:bg-red-100'
          }`}
        >
          Remove
        </button>
      )}
    </div>
  </div>
</div>
    </div>
  )}
</div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={`block text-xs font-medium ${
                    darkMode ? 'text-[#b4b2ab]' : 'text-gray-700'
                  }`}>
                    Post Text
                  </label>
                  <div className="flex gap-2">
                    {!postText && (
                      <button
                        onClick={loadSamplePost}
                        className={`text-xs font-medium ${
                          darkMode ? 'text-[#9a989f] hover:text-[#b4b2ab]' : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        Load Sample
                      </button>
                    )}
                    {postText && (
                      <>
                        <button
                          onClick={applyAutoSpacing}
                          className={`text-xs font-medium ${
                            darkMode ? 'text-[#9a989f] hover:text-[#b4b2ab]' : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          Auto-Space
                        </button>
                        <button
                          onClick={clearPost}
                          className={`text-xs font-medium ${
                            darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                          }`}
                        >
                          Clear
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <textarea
                  value={postText}
                  onChange={handleTextChange}
                  className={`w-full px-3 py-2.5 text-sm border rounded-t-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-sans ${
                    darkMode
                      ? 'bg-[#38434f] border-[#545d69] text-[#e8e6e3] placeholder-[#7a7a7a]'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  rows="14"
                  placeholder="What do you want to talk about?"
                  style={{ lineHeight: '1.4' }}
                />
                
                {/* Media Toolbar */}
                <div className={`flex items-center justify-between px-3 py-2 border border-t-0 rounded-b-lg ${
                  darkMode ? 'bg-[#38434f] border-[#545d69]' : 'bg-white border-gray-300'
                }`}>
                  <div className="flex items-center gap-1">
                    {/* Image Button */}
                    <button
                      onClick={() => handleMediaTypeSelect('image')}
                      disabled={mediaType && mediaType !== 'image'}
                      className={`p-2 rounded hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                        mediaType === 'image' ? 'bg-blue-50 text-blue-600' : darkMode ? 'text-[#b4b2ab]' : 'text-gray-600'
                      }`}
                      title="Add images"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21 15 16 10 5 21"/>
                      </svg>
                    </button>

                    {/* Document Button */}
                    <button
                      onClick={() => handleMediaTypeSelect('document')}
                      disabled={mediaType && mediaType !== 'document'}
                      className={`p-2 rounded hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                        mediaType === 'document' ? 'bg-blue-50 text-blue-600' : darkMode ? 'text-[#b4b2ab]' : 'text-gray-600'
                      }`}
                      title="Add document"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
                      </svg>
                    </button>

         

                    {/* Remove Media Button */}
                    {mediaType && (
                      <button
                        onClick={removeMedia}
                        className={`p-2 rounded hover:bg-red-50 transition-colors ml-1 ${
                          darkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'
                        }`}
                        title="Remove media"
                      >
                        <X size={20} />
                      </button>
                    )}
                  </div>

                  {/* Character Count */}
<div className={`text-xs font-medium ${
  charCount > 3000 
    ? 'text-red-600' 
    : charCount >= 2700 
    ? 'text-yellow-600' 
    : 'text-green-600'
}`}>
  {charCount.toLocaleString()} / 3,000 characters • {lineCount} {lineCount === 1 ? 'line' : 'lines'}
</div>
                </div>

                {/* Hidden file inputs */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,image/gif"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
                
                <input
                  ref={documentInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handleDocumentUpload}
                  className="hidden"
                />

                {/* Media preview/management */}
                

                {mediaType === 'document' && uploadedDocument && (
                  <div className={`p-3 rounded-lg border ${
                    darkMode ? 'border-[#545d69] bg-[#38434f]' : 'border-gray-200 bg-gray-50'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1">
                        <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
                        </svg>
                        <div className="flex-1">
                          <p className={`text-xs ${darkMode ? 'text-[#9a989f]' : 'text-gray-500'}`}>
                            {documentPages.length} pages
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={removeMedia}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${
                        darkMode ? 'text-[#b4b2ab]' : 'text-gray-700'
                      }`}>
                        Document Title
                      </label>
                      <input
                        type="text"
                        value={documentTitle}
                        onChange={(e) => setDocumentTitle(e.target.value)}
                        className={`w-full px-2 py-1.5 text-xs border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          darkMode 
                            ? 'bg-[#1b1f23] border-[#545d69] text-[#e8e6e3] placeholder-[#7a7a7a]' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        placeholder="Document title"
                      />
                    </div>
                  </div>
                )}

                {mediaType && (
                  <button
                    onClick={removeMedia}
                    className={`mt-2 text-xs font-medium ${
                      darkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'
                    }`}
                  >
                    Remove all media
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className={`rounded-xl shadow-sm border p-6 ${
            darkMode ? 'bg-[#1b1f23] border-[#38434f]' : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-lg font-semibold ${darkMode ? 'text-[#e8e6e3]' : 'text-gray-900'}`}>Preview</h2>
              
              <div className="flex items-center gap-3">
                <button
  onClick={() => setDarkMode(!darkMode)}
  className={`p-1.5 rounded-md transition-colors ${
    darkMode 
      ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' 
      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
  }`}
  title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
>
                  {darkMode ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 18a6 6 0 110-12 6 6 0 010 12zm0-2a4 4 0 100-8 4 4 0 000 8zM11 1h2v3h-2V1zm0 19h2v3h-2v-3zM3.515 4.929l1.414-1.414L7.05 5.636 5.636 7.05 3.515 4.93zM16.95 18.364l1.414-1.414 2.121 2.121-1.414 1.414-2.121-2.121zm2.121-14.85l1.414 1.415-2.121 2.121-1.414-1.414 2.121-2.121zM5.636 16.95l1.414 1.414-2.121 2.121-1.414-1.414 2.121-2.121zM23 11v2h-3v-2h3zM4 11v2H1v-2h3z"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M10 7a7 7 0 0012 4.9v.1c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2h.1A6.979 6.979 0 0010 7zm-6 5a8 8 0 0015.062 3.762A9 9 0 018.238 4.938 7.999 7.999 0 004 12z"/>
                    </svg>
                  )}
                </button>
                
                <button
                  onClick={downloadAsImage}
                  disabled={downloading || !postText}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Download size={16} />
                  {downloading ? 'Downloading...' : 'Download'}
                </button>
                
                <div className={`flex gap-1 p-1 rounded-lg ${
  darkMode ? 'bg-[#38434f]' : 'bg-gray-100'
}`}>
  <button
    onClick={() => { setViewMode('mobile'); setShowFullText(false); setHasExpandedOnce(false); }}
    className={`p-2 rounded-md transition-all ${
      viewMode === 'mobile' 
        ? darkMode 
          ? 'bg-blue-600 text-white shadow-sm' 
          : 'bg-white text-blue-600 shadow-sm'
        : darkMode
          ? 'text-[#b4b2ab] hover:text-[#e8e6e3]'
          : 'text-gray-500 hover:text-gray-700'
    }`}
    title="Mobile"
  >
    <Smartphone size={18} />
  </button>
  <button
    onClick={() => { setViewMode('ipad'); setShowFullText(false); setHasExpandedOnce(false); }}
    className={`p-2 rounded-md transition-all ${
      viewMode === 'ipad' 
        ? darkMode 
          ? 'bg-blue-600 text-white shadow-sm' 
          : 'bg-white text-blue-600 shadow-sm'
        : darkMode
          ? 'text-[#b4b2ab] hover:text-[#e8e6e3]'
          : 'text-gray-500 hover:text-gray-700'
    }`}
    title="iPad"
  >
    <Tablet size={18} />
  </button>
  <button
    onClick={() => { setViewMode('desktop'); setShowFullText(false); setHasExpandedOnce(false); }}
    className={`p-2 rounded-md transition-all ${
      viewMode === 'desktop' 
        ? darkMode 
          ? 'bg-blue-600 text-white shadow-sm' 
          : 'bg-white text-blue-600 shadow-sm'
        : darkMode
          ? 'text-[#b4b2ab] hover:text-[#e8e6e3]'
          : 'text-gray-500 hover:text-gray-700'
    }`}
    title="Desktop"
  >
    <Monitor size={18} />
  </button>
</div>
              </div>
            </div>

            <div className={`flex justify-center items-start min-h-[600px] rounded-lg p-4 overflow-auto ${
              darkMode 
                ? 'bg-gradient-to-br from-[#000000] to-[#1a1a1a]' 
                : 'bg-gradient-to-br from-gray-50 to-gray-100'
            }`}>
              <div className={getPreviewContainerClass()} style={getPreviewStyle()}>
                <LinkedInPost />
              </div>
            </div>

            <div className="mt-4 text-center">
              <span className={`inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full ${
                darkMode 
                  ? 'text-[#b4b2ab] bg-[#38434f]' 
                  : 'text-gray-500 bg-gray-100'
              }`}>
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Viewing: <span className="font-semibold capitalize">{viewMode}</span> 
                ({DEVICE_CONFIG[viewMode].maxLines} lines max)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}