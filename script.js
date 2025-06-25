document.addEventListener('DOMContentLoaded', () => {

    // --- 설정 (Configuration) ---
    // TODO: Google Apps Script 배포 후 받은 URL을 여기에 붙여넣으세요.
    const GUESTBOOK_API_URL = 'https://script.google.com/macros/s/AKfycbxr0TWXc2wAqtfIlU87xjE_NTlkH0IsEa-m9HGcEZMBLy8wrga9-qkb9s9uGbV1DjPj/exec';
    const COMMENTS_PER_PAGE = 5;

    // --- DOM 요소 ---
    const commentForm = document.getElementById('comment-form');
    const commentList = document.getElementById('comment-list');
    const paginationContainer = document.getElementById('pagination');
    const submitButton = document.getElementById('submit-button');
    const copyButtons = document.querySelectorAll('.btn-copy');
    const galleryItems = document.querySelectorAll('.gallery__item img');
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

    // 갤러리 라이트박스
    galleryItems.forEach(img => {
        img.addEventListener('click', () => {
            lightboxModal.style.display = 'flex';
            lightboxImage.src = img.src;
        });
    });
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
            commentList.innerHTML = '<p style="text-align:center; padding: 2rem 0; color:#999;">아직 등록된 축하 메시지가 없습니다. 첫 번째 메시지를 남겨주세요!</p>';
            return;
        }
        commentsToRender.forEach(comment => {
            const item = document.createElement('div');
            item.className = 'comment-item';
            const date = new Date(comment.timestamp);
            const formattedDate = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
            item.innerHTML = `
                <div class="comment-header">
                    <strong>${escapeHtml(comment.name)}</strong>
                    <span>${formattedDate}</span>
                </div>
                <p class="comment-body">${escapeHtml(comment.content)}</p>
            `;
            commentList.appendChild(item);
        });
    }

    // 페이지네이션 렌더링
    function setupPagination() {
        paginationContainer.innerHTML = '';
        const pageCount = Math.ceil(allComments.length / COMMENTS_PER_PAGE);
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
        if (!GUESTBOOK_API_URL.startsWith('https://')) {
            console.warn("방명록 API 주소가 설정되지 않았습니다.");
            renderComments();
            setupPagination();
            return;
        }
        try {
            const response = await fetch(GUESTBOOK_API_URL);
            const data = await response.json();
            allComments = data.comments || [];
        } catch (error) {
            console.error("댓글 로딩 실패:", error);
            commentList.innerHTML = '<p style="text-align:center; padding: 2rem 0; color:red;">댓글을 불러오는 중 오류가 발생했습니다.</p>';
        } finally {
            renderComments();
            setupPagination();
        }
    }
    
    // 새 댓글 등록 (Submit)
    async function handleFormSubmit(e) {
        e.preventDefault();
        const nameInput = document.getElementById('comment-name');
        const passwordInput = document.getElementById('comment-password');
        const contentInput = document.getElementById('comment-text');

        const newComment = {
            name: nameInput.value.trim(),
            password: passwordInput.value,
            content: contentInput.value.trim(),
        };

        if (!newComment.name || !newComment.password || !newComment.content) {
            alert('이름, 비밀번호, 내용을 모두 입력해주세요.');
            return;
        }

        try {
            submitButton.disabled = true;
            submitButton.innerText = '등록 중...';

            await fetch(GUESTBOOK_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify(newComment),
                mode: 'no-cors' // doPost는 no-cors로 호출해도 잘 동작합니다.
            });
            
            alert('소중한 메시지가 등록되었습니다. 감사합니다!');
            commentForm.reset();
            fetchComments(); // 목록 새로고침

        } catch (error) {
            console.error("댓글 등록 실패:", error);
            alert("댓글 등록 중 오류가 발생했습니다.");
        } finally {
            submitButton.disabled = false;
            submitButton.innerText = '글 남기기';
        }
    }

    // HTML 태그 이스케이프 (XSS 방지)
    function escapeHtml(text) {
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    // --- 초기화 (Initialization) ---
    commentForm.addEventListener('submit', handleFormSubmit);
    fetchComments();
});