// admin/js/users.js
// Script xử lý chỉnh sửa người dùng (Edit User Modal)
// Yêu cầu: users.html đã chèn modal #editUserModal và import tệp này cuối trang
// Author: Cascade

(function () {
    // ==== DOM helpers ====
    const qs = (sel, base = document) => base.querySelector(sel);
    const qsa = (sel, base = document) => [...base.querySelectorAll(sel)];

    // ==== State ====
    let currentEditingRow = null; // Lưu trữ <tr> hiện đang chỉnh sửa

    // ==== Modal control ====
    const editModal = qs('#editUserModal');
    const modalOverlay = qs('#editUserModal .modal-overlay');
    const closeBtn = qs('#editUserModal .close-edit-user');
    const cancelBtn = qs('#cancelEditUser');

    const openModal = () => {
        if (!editModal) return;
        editModal.classList.add('open');
        document.body.style.overflow = 'hidden';
    };

    const closeModal = () => {
        if (!editModal) return;
        editModal.classList.remove('open');
        document.body.style.overflow = '';
        // Reset form when modal closes
        qs('#editUserForm').reset();
        currentEditingRow = null;
    };

    // ==== Extract data from table row ====
    function getUserDataFromRow(row) {
        if (!row) return null;
        const cells = qsa('td', row);
        if (cells.length < 9) return null;
        const name = qs('.user-name', cells[1])?.textContent.trim();
        const username = qs('.user-username', cells[1])?.textContent.replace('@', '').trim();
        const email = cells[2]?.textContent.trim();
        const roleText = cells[3]?.textContent.trim();
        const roleValue = roleText.includes('Quản trị') ? 'admin' : roleText.includes('Cộng tác') ? 'contributor' : 'user';
        const statusText = cells[7]?.textContent.trim();
        let statusValue = 'active';
        if (statusText.includes('Tạm')) statusValue = 'inactive';
        else if (statusText.includes('Chờ')) statusValue = 'pending';
        return { name, username, email, role: roleValue, status: statusValue };
    }

    // ==== Prefill modal form ====
    function fillEditForm(data) {
        if (!data) return;
        qs('#editFullName').value = data.name || '';
        qs('#editUsername').value = data.username || '';
        qs('#editEmail').value = data.email || '';
        qs('#editRole').value = data.role || 'user';
        qs('#editStatus').value = data.status || 'active';
    }

    // ==== Table action buttons ====
    function attachEditButtons() {
        const editBtns = qsa('.edit-user-btn');
        editBtns.forEach(btn => {
            btn.addEventListener('click', function () {
                const row = this.closest('tr');
                currentEditingRow = row;
                const data = getUserDataFromRow(row);
                fillEditForm(data);
                openModal();
            });
        });
    }

    // ==== Other per-row actions ====
    function attachOtherActionButtons() {
        const actionButtons = qsa('.action-buttons .action-btn');
        actionButtons.forEach(btn => {
            btn.addEventListener('click', function () {
                const icon = this.querySelector('i');
                if (!icon) return;
                const row = this.closest('tr');
                if (!row) return;

                // Determine action by icon class or title attribute
                let action = '';
                if (icon.classList.contains('fa-lock')) action = 'lock';
                else if (icon.classList.contains('fa-unlock')) action = 'unlock';
                else if (icon.classList.contains('fa-trash')) action = 'delete';
                else if (icon.classList.contains('fa-check')) action = 'approve';
                else if (icon.classList.contains('fa-times')) action = 'reject';

                // Fallback use title attr
                if (!action) {
                    const title = (this.getAttribute('title') || '').toLowerCase();
                    if (title.includes('khóa')) action = 'lock';
                    else if (title.includes('mở')) action = 'unlock';
                    else if (title.includes('xóa')) action = 'delete';
                    else if (title.includes('xác nhận')) action = 'approve';
                    else if (title.includes('từ chối')) action = 'reject';
                }

                if (!action) return; // Unknown

                handleUserAction(row, action);
            });
        });
    }

        // ==== Confirm modal helpers ====
    const confirmModal = qs('#confirmActionModal');
    const confirmMsgEl = qs('#confirmActionMessage');
    const confirmYesBtn = qs('#confirmActionYes');
    const confirmNoBtn = qs('#confirmActionNo');
    let confirmCallback = null;

    function showConfirm(message, onYes) {
        if (!confirmModal) {
            if (window.confirm(message)) onYes();
            return;
        }
        confirmMsgEl.textContent = message;
        confirmCallback = onYes;
        confirmModal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeConfirm() {
        confirmModal.classList.remove('open');
        document.body.style.overflow = '';
    }

    confirmYesBtn?.addEventListener('click', () => {
        if (confirmCallback) confirmCallback();
        closeConfirm();
    });
    confirmNoBtn?.addEventListener('click', closeConfirm);
    qs('#confirmActionModal .modal-overlay')?.addEventListener('click', closeConfirm);

    // ==== Handle user action ====
    function handleUserAction(row, action) {
        const userName = qs('.user-name', row)?.textContent.trim() || 'người dùng';
        let confirmMsg = '';
        switch (action) {
            case 'lock':
                confirmMsg = `Bạn có chắc chắn muốn khóa tài khoản của ${userName}?`;
                break;
            case 'unlock':
                confirmMsg = `Mở khóa tài khoản của ${userName}?`;
                break;
            case 'delete':
                confirmMsg = `Bạn có chắc chắn muốn xóa vĩnh viễn ${userName}?`;
                break;
            case 'approve':
                confirmMsg = `Xác nhận tài khoản của ${userName}?`;
                break;
            case 'reject':
                confirmMsg = `Từ chối tài khoản của ${userName}?`;
                break;
        }
        if (confirmMsg) {
            showConfirm(confirmMsg, () => performAction(row, action, userName));
        } else {
            performAction(row, action, userName);
        }
    }

    function performAction(row, action, userName) {
        // Simulate API delay
        setTimeout(() => {
            switch (action) {
                case 'lock': {
                    const statusCell = qsa('td', row)[7];
                    statusCell.innerHTML = '<span class="status-badge inactive">Tạm khóa</span>';
                    // Change icon to unlock for future action
                    const icon = row.querySelector('.fa-lock');
                    if (icon) {
                        icon.classList.remove('fa-lock');
                        icon.classList.add('fa-unlock');
                        icon.parentElement.setAttribute('title', 'Mở khóa tài khoản');
                    }
                    showToast(`Đã khóa tài khoản của ${userName}`, 'success');
                    break;
                }
                case 'unlock': {
                    const statusCell = qsa('td', row)[7];
                    statusCell.innerHTML = '<span class="status-badge approved">Hoạt động</span>';
                    const icon = row.querySelector('.fa-unlock');
                    if (icon) {
                        icon.classList.remove('fa-unlock');
                        icon.classList.add('fa-lock');
                        icon.parentElement.setAttribute('title', 'Khóa tài khoản');
                    }
                    showToast(`Đã mở khóa tài khoản của ${userName}`, 'success');
                    break;
                }
                case 'delete': {
                    row.style.opacity = '0.5';
                    setTimeout(() => row.remove(), 300);
                    showToast(`Đã xóa ${userName}`, 'success');
                    break;
                }
                case 'approve': {
                    const statusCell = qsa('td', row)[7];
                    statusCell.innerHTML = '<span class="status-badge approved">Hoạt động</span>';
                    showToast(`Đã xác nhận tài khoản của ${userName}`, 'success');
                    break;
                }
                case 'reject': {
                    const statusCell = qsa('td', row)[7];
                    statusCell.innerHTML = '<span class="status-badge rejected">Từ chối</span>';
                    showToast(`Đã từ chối tài khoản của ${userName}`, 'info');
                    break;
                }
            }
        }, 200);
    }

    // ==== Handle form submit ====
    qs('#editUserForm').addEventListener('submit', function (e) {
        e.preventDefault();
        // Lấy dữ liệu từ form
        const formData = {
            name: qs('#editFullName').value.trim(),
            username: qs('#editUsername').value.trim(),
            email: qs('#editEmail').value.trim(),
            role: qs('#editRole').value,
            status: qs('#editStatus').value
        };

        // TODO: Gửi formData tới API - demo hiển thị tại bảng local
        if (currentEditingRow) {
            // Cập nhật giao diện bảng (demo)
            qs('.user-name', currentEditingRow).textContent = formData.name;
            qs('.user-username', currentEditingRow).innerHTML = `@${formData.username}`;
            qsa('td', currentEditingRow)[2].textContent = formData.email;
            // Cập nhật badge role
            const roleCell = qsa('td', currentEditingRow)[3];
            roleCell.innerHTML = `<span class="role-badge ${formData.role}">${formData.role === 'admin' ? 'Quản trị viên' : formData.role === 'contributor' ? 'Cộng tác viên' : 'Người dùng'}</span>`;
            // Cập nhật status badge
            const statusCell = qsa('td', currentEditingRow)[7];
            const statusMap = {
                active: { text: 'Hoạt động', cls: 'approved' },
                inactive: { text: 'Tạm khóa', cls: 'inactive' },
                pending: { text: 'Chờ xác nhận', cls: 'pending' }
            };
            const st = statusMap[formData.status] || statusMap.active;
            statusCell.innerHTML = `<span class="status-badge ${st.cls}">${st.text}</span>`;
        }

        if (typeof showToast === 'function') {
            showToast('Cập nhật người dùng thành công!', 'success');
        }
        closeModal();
    });

    // ==== Event listeners ====
    closeBtn?.addEventListener('click', closeModal);
    cancelBtn?.addEventListener('click', closeModal);
    modalOverlay?.addEventListener('click', closeModal);

    // ==== Init ====
    // Gọi ngay: nếu bảng đã có sẵn khi script được chèn cuối body thì sẽ gắn sự kiện ngay
    attachEditButtons();
    attachOtherActionButtons();
    attachDetailButtons();
    // Fallback DOMContentLoaded
    document.addEventListener('DOMContentLoaded', () => {
        attachEditButtons();
        attachOtherActionButtons();
        attachDetailButtons();
    });
    // ==== User Detail Modal Logic ====
    const detailModal = qs('#userDetailModal');
    const detailOverlay = qs('#userDetailModal .modal-overlay');
    const detailCloseBtn = qs('#userDetailModal .close-modal');
    const saveNotesBtn = qs('#saveAdminNotesBtn');
    const adminNotesTextarea = qs('#adminNotesTextarea');

    function attachDetailButtons() {
        const detailBtns = qsa('.detail-user-btn');
        detailBtns.forEach(btn => {
            btn.addEventListener('click', function () {
                const row = this.closest('tr');
                openUserDetailModal(row);
            });
        });
    }

    function closeDetailModal() {
        if (!detailModal) return;
        detailModal.classList.remove('open');
        document.body.style.overflow = '';
    }

    detailCloseBtn?.addEventListener('click', closeDetailModal);
    detailOverlay?.addEventListener('click', closeDetailModal);

    saveNotesBtn?.addEventListener('click', () => {
        if (!adminNotesTextarea) return;
        const notes = adminNotesTextarea.value.trim();
        const username = qs('#detailUserUsername')?.textContent || '';
        if (!username) {
            showToast('Không xác định được người dùng!', 'error');
            return;
        }
        localStorage.setItem('userNotes_'+username, notes);
        showToast('Đã lưu ghi chú của Admin!', 'success');
    });

    // Click Esc to close detail modal
    document.addEventListener('keydown', (e)=>{
        if(e.key==='Escape' && detailModal?.classList.contains('open')) closeDetailModal();
    });

})();
