document.addEventListener('DOMContentLoaded', () => {

    // --- 설정 (Configuration) ---
    // TODO: Google Apps Script 배포 후 받은 '기존' URL을 여기에 붙여넣으세요.
    const GUESTBOOK_API_URL = 'https://script.google.com/macros/s/AKfycbx_iBWQ_Hv07HI4AFX52hX_htUqzFq7pDvCHXL_ZTZZGQt7Y0TU49Xc_pj7Kq493l4f/exec';
    const COMMENTS_PER_PAGE = 5;

    // --- DOM 요소 ---
    const commentForm = document.getElementById('comment-form');
    const commentList = document.getElementById('comment-list');
    const paginationContainer = document.getElementById('pagination');
    const submitButton = document.getElementById('submit-button');
    const loaderContainer = document.getElementById('loader-container');
    const copyButtons = document.querySelectorAll('.btn-copy');
    const lightboxModal = document.getElementById('lightbox-modal');
    const lightboxImage = document.getElementById('lightbox-image');
    const lightboxClose = document.querySelector('.lightbox-close');

    // --- 상태 관리 (State) ---
    let allComments = [];
    let currentPage = 1;

    // --- 기능 구현 (Functions) ---

    // 스크롤 애니메이션
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
            }
        });
    }, { threshold: 0.1 });
    document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
    
    // 클립보드 복사
    copyButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const textToCopy = e.target.getAttribute('data-clipboard-text');
            navigator.clipboard.writeText(textToCopy).then(() => {
                alert('계좌번호가 복사되었습니다.');
            }).catch(err => console.error('Copy failed:', err));
        });
    });

    // 가로 스크롤 갤러리 (모든 기능 최종판)
    const galleryContainer = document.querySelector('.gallery-container');
    if (galleryContainer) {
        const galleryWrapper = document.querySelector('.gallery-wrapper');
        const slides = document.querySelectorAll('.gallery-slide');
        const prevButton = document.getElementById('gallery-prev');
        const nextButton = document.getElementById('gallery-next');
        const dotsContainer = document.getElementById('gallery-dots');
        
        let realSlideCount = slides.length;
        if (realSlideCount > 0) {
            let currentIndex = 0; // 0-based index for the real slides
            let currentSlideIndexWithClones = 1; // 1-based index for the wrapper with clones
            let autoSlideInterval = null;
            let isTransitioning = false;
            let touchStartX = 0;
            let isDragging = false;

            // 무한 루프를 위한 클론 생성
            const firstClone = slides[0].cloneNode(true);
            const lastClone = slides[realSlideCount - 1].cloneNode(true);
            galleryWrapper.appendChild(firstClone);
            galleryWrapper.insertBefore(lastClone, slides[0]);

            // 인디케이터(점) 생성
            for (let i = 0; i < realSlideCount; i++) {
                const dot = document.createElement('button');
                dot.classList.add('dot');
                dot.setAttribute('data-index', i);
                dotsContainer.appendChild(dot);
            }
            const dots = document.querySelectorAll('.dot');
            
            function updateDots() {
                if (!dots.length) return;
                dots.forEach(dot => dot.classList.remove('active'));
                dots[currentIndex].classList.add('active');
            }
            
            function moveTo(index, withAnimation = true) {
                if (isTransitioning) return;
                isTransitioning = withAnimation;
                
                currentIndex = index;
                currentSlideIndexWithClones = currentIndex + 1;
                galleryWrapper.style.transition = withAnimation ? 'transform 0.5s ease-in-out' : 'none';
                galleryWrapper.style.transform = `translateX(-${currentSlideIndexWithClones * 100}%)`;
                updateDots();
            }

            function handleNext() {
                if (isTransitioning) return;
                currentSlideIndexWithClones++;
                isTransitioning = true;
                galleryWrapper.style.transition = 'transform 0.5s ease-in-out';
                galleryWrapper.style.transform = `translateX(-${currentSlideIndexWithClones * 100}%)`;
                currentIndex = (currentIndex + 1) % realSlideCount;
                updateDots();
            }

            function handlePrev() {
                if (isTransitioning) return;
                currentSlideIndexWithClones--;
                isTransitioning = true;
                galleryWrapper.style.transition = 'transform 0.5s ease-in-out';
                galleryWrapper.style.transform = `translateX(-${currentSlideIndexWithClones * 100}%)`;
                currentIndex = (currentIndex - 1 + realSlideCount) % realSlideCount;
                updateDots();
            }

            galleryWrapper.addEventListener('transitionend', () => {
                isTransitioning = false;
                if (currentSlideIndexWithClones === 0) {
                    moveTo(realSlideCount - 1, false);
                }
                if (currentSlideIndexWithClones === realSlideCount + 1) {
                    moveTo(0, false);
                }
            });
            
            nextButton.addEventListener('click', handleNext);
            prevButton.addEventListener('click', handlePrev);
            
            dots.forEach(dot => {
                dot.addEventListener('click', (e) => {
                    const index = parseInt(e.target.getAttribute('data-index'));
                    moveTo(index);
                });
            });

            function startAutoSlide() {
                stopAutoSlide();
                autoSlideInterval = setInterval(handleNext, 4000);
            }
            function stopAutoSlide() {
                clearInterval(autoSlideInterval);
            }
            
            galleryContainer.addEventListener('mouseenter', stopAutoSlide);
            galleryContainer.addEventListener('mouseleave', startAutoSlide);
            
            function handleTouchStart(e) {
                stopAutoSlide();
                isDragging = false;
                touchStartX = e.touches[0].clientX;
            }
            function handleTouchEnd(e) {
                if (touchStartX === 0) return;
                const touchEndX = e.changedTouches[0].clientX;
                const swipeDistance = touchStartX - touchEndX;
                const swipeThreshold = 50;
                
                if (Math.abs(swipeDistance) > swipeThreshold) {
                    if (swipeDistance > 0) handleNext();
                    else handlePrev();
                }
                
                startAutoSlide();
                touchStartX = 0;
                setTimeout(() => { isDragging = false; }, 100);
            }

            galleryContainer.addEventListener('touchstart', handleTouchStart, { passive: true });
            galleryContainer.addEventListener('touchend', handleTouchEnd);
            
            document.querySelectorAll('.gallery-slide img').forEach(img => {
                img.addEventListener('click', (e) => {
                    if (isDragging) return;
                    lightboxModal.style.display = 'flex';
                    lightboxImage.src = e.target.src;
                });
            });
            
            moveTo(0, false); // 초기 위치 설정
            startAutoSlide();
        }
    }
    
    // 라이트박스 닫기
    const closeLightbox = () => lightboxModal.style.display = 'none';
    lightboxClose.addEventListener('click', closeLightbox);
    lightboxModal.addEventListener('click', (e) => {
        if (e.target === lightboxModal) closeLightbox();
    });

    // 댓글 렌더링
    function renderComments() {
        commentList.innerHTML = '';
        const startIndex = (currentPage - 1) * COMMENTS_PER_PAGE;
        const endIndex = startIndex + COMMENTS_PER_PAGE;
        const commentsToRender = allComments.slice(startIndex, endIndex);
        if (commentsToRender.length === 0 && currentPage === 1) {
            commentList.innerHTML = '<p style="text-align:center; padding: 2rem 0; color:#999;">아직 등록된 축하 메시지가 없습니다.</p>';
            return;
        }
        commentsToRender.forEach(comment => {
            const item = document.createElement('div');
            item.className = 'comment-item';
            const date = new Date(comment.timestamp);
            const formattedDate = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
            item.innerHTML = `<div class="comment-header"><strong>${escapeHtml(comment.name)}</strong><div class="comment-meta"><span>${formattedDate}</span><button class="btn-delete" data-row-index="${comment.rowIndex}">삭제</button></div></div><p class="comment-body">${escapeHtml(comment.content)}</p>`;
            commentList.appendChild(item);
        });
    }

    // 페이지네이션 렌더링
    function setupPagination() {
        paginationContainer.innerHTML = '';
        const pageCount = Math.ceil(allComments.length / COMMENTS_PER_PAGE);
        if (pageCount <= 1) return;
        for (let i = 1; i <= pageCount; i++) {
            const btn = document.createElement('button');
            btn.innerText = i;
            if (i === currentPage) btn.classList.add('active');
            btn.addEventListener('click', () => {
                currentPage = i;
                renderComments();
                setupPagination();
                document.querySelector('.guestbook').scrollIntoView({ behavior: 'smooth' });
            });
            paginationContainer.appendChild(btn);
        }
    }

    // 댓글 불러오기 (Fetch)
    async function fetchComments() {
        loaderContainer.style.display = 'flex';
        commentList.style.display = 'none';
        paginationContainer.style.display = 'none';
        try {
            if (!GUESTBOOK_API_URL.startsWith('https://')) throw new Error("API 주소가 설정되지 않았습니다.");
            const response = await fetch(GUESTBOOK_API_URL);
            if (!response.ok) throw new Error(`서버 응답 오류: ${response.status}`);
            const data = await response.json();
            if (data.result === 'success') {
                allComments = data.comments || [];
                renderComments();
                setupPagination();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error("댓글 로딩 실패:", error);
            commentList.innerHTML = `<p style="text-align:center; padding: 2rem 0; color:red;">댓글을 불러오는 중 오류가 발생했습니다.<br>${error.message}</p>`;
        } finally {
            loaderContainer.style.display = 'none';
            commentList.style.display = 'block';
            paginationContainer.style.display = 'flex';
        }
    }
    
    // 새 댓글 등록 (Submit)
    async function handleFormSubmit(e) {
        e.preventDefault();
        const nameInput = document.getElementById('comment-name');
        const passwordInput = document.getElementById('comment-password');
        const contentInput = document.getElementById('comment-text');
        const newComment = { name: nameInput.value.trim(), password: passwordInput.value, content: contentInput.value.trim() };
        if (!newComment.name || !newComment.password || !newComment.content) {
            alert('이름, 비밀번호, 내용을 모두 입력해주세요.');
            return;
        }
        try {
            submitButton.disabled = true;
            submitButton.innerText = '등록 중...';
            const response = await fetch(GUESTBOOK_API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(newComment) });
            if (!response.ok) throw new Error(`서버 응답 오류: ${response.status}`);
            const result = await response.json();
            if (result.result === 'success') {
                alert('소중한 메시지가 등록되었습니다. 감사합니다!');
                commentForm.reset();
                fetchComments();
            } else {
                throw new Error(result.message || '알 수 없는 오류');
            }
        } catch (error) {
            console.error("댓글 등록 실패:", error);
            alert("댓글 등록 중 오류가 발생했습니다: " + error.message);
        } finally {
            submitButton.disabled = false;
            submitButton.innerText = '글 남기기';
        }
    }

    // 댓글 삭제 기능
    async function handleDeleteComment(deleteButton) {
        const rowIndex = deleteButton.getAttribute('data-row-index');
        const password = prompt('댓글 작성 시 입력했던 비밀번호를 입력하세요.');
        if (password === null) return;
        if (!password) {
            alert('비밀번호를 입력해야 삭제할 수 있습니다.');
            return;
        }
        const deleteRequest = { action: 'delete', rowIndex: rowIndex, password: password };
        try {
            deleteButton.innerText = '삭제 중...';
            deleteButton.disabled = true;
            const response = await fetch(GUESTBOOK_API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(deleteRequest) });
            if (!response.ok) throw new Error(`서버 응답 오류: ${response.status}`);
            const result = await response.json();
            if (result.result === 'success') {
                alert(result.message);
                fetchComments();
            } else {
                throw new Error(result.message || '알 수 없는 오류');
            }
        } catch (error) {
            console.error("삭제 실패:", error);
            alert("삭제 중 오류가 발생했습니다: " + error.message);
            deleteButton.innerText = '삭제';
            deleteButton.disabled = false;
        }
    }

    // HTML 태그 이스케이프 (XSS 방지)
    function escapeHtml(text) {
        const safeText = String(text || '');
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
        return safeText.replace(/[&<>"']/g, m => map[m]);
    }

    // --- 이벤트 리스너 (Event Listeners) ---
    commentForm.addEventListener('submit', handleFormSubmit);
    commentList.addEventListener('click', function(e) {
        if (e.target && e.target.classList.contains('btn-delete')) {
            handleDeleteComment(e.target);
        }
    });

    // --- 초기화 (Initialization) ---
    fetchComments();
});