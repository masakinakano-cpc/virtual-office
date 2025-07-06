import { ref, Ref } from 'vue';

// 汎用的なPromptフック
export function usePrompt(onPrompt: () => void) {
    const promise: Ref<Promise<any> | null> = ref(null);
    let resolveRef: ((value: any) => void) | undefined;

    const prompt = () => {
        const newPromise = new Promise((resolve) => {
            resolveRef = resolve;
        });

        onPrompt();
        promise.value = newPromise;
        return newPromise;
    };

    const resolve = (value: any) => {
        if (resolveRef) {
            resolveRef(value);
            resolveRef = undefined;
            promise.value = null;
        }
    };

    return {
        prompt,
        resolve,
        promise,
    };
}

// 確認ダイアログ専用フック
export function useConfirmDialog(onPrompt: () => void) {
    const { prompt, resolve, promise } = usePrompt(onPrompt);

    const accept = () => resolve(true);
    const deny = () => resolve(false);

    return {
        prompt,
        accept,
        deny,
        promise,
    };
}

// 確認ダイアログの状態管理フック
export function useConfirmDialogState() {
    const isOpen = ref(false);
    const title = ref('');
    const description = ref('');
    const confirmLabel = ref('Confirm');
    const cancelLabel = ref('Cancel');
    const variant = ref<'normal' | 'error' | 'warning' | 'success'>('normal');

    const { prompt, accept, deny, promise } = useConfirmDialog(() => {
        isOpen.value = true;
    });

    const close = () => {
        isOpen.value = false;
    };

    const confirm = async (options: {
        title?: string;
        description?: string;
        confirmLabel?: string;
        cancelLabel?: string;
        variant?: 'normal' | 'error' | 'warning' | 'success';
    } = {}): Promise<boolean> => {
        // 設定を更新
        if (options.title !== undefined) title.value = options.title;
        if (options.description !== undefined) description.value = options.description;
        if (options.confirmLabel !== undefined) confirmLabel.value = options.confirmLabel;
        if (options.cancelLabel !== undefined) cancelLabel.value = options.cancelLabel;
        if (options.variant !== undefined) variant.value = options.variant;

        // ダイアログを表示してPromiseを返す
        return prompt() as Promise<boolean>;
    };

    const handleConfirm = () => {
        accept();
        close();
    };

    const handleCancel = () => {
        deny();
        close();
    };

    const handleClose = () => {
        deny();
        close();
    };

    return {
        // 状態
        isOpen,
        title,
        description,
        confirmLabel,
        cancelLabel,
        variant,
        promise,

        // メソッド
        confirm,
        handleConfirm,
        handleCancel,
        handleClose,
        close,
    };
}

// 削除確認専用フック
export function useDeleteConfirm() {
    const confirmDialog = useConfirmDialogState();

    const confirmDelete = (itemName?: string): Promise<boolean> => {
        return confirmDialog.confirm({
            title: 'Delete Confirmation',
            description: itemName
                ? `Are you sure you want to delete "${itemName}"? This action cannot be undone.`
                : 'Are you sure you want to delete this item? This action cannot be undone.',
            confirmLabel: 'Delete',
            cancelLabel: 'Cancel',
            variant: 'error',
        });
    };

    return {
        ...confirmDialog,
        confirmDelete,
    };
}

// 保存確認専用フック
export function useSaveConfirm() {
    const confirmDialog = useConfirmDialogState();

    const confirmSave = (hasUnsavedChanges = true): Promise<boolean> => {
        if (!hasUnsavedChanges) {
            return Promise.resolve(true);
        }

        return confirmDialog.confirm({
            title: 'Unsaved Changes',
            description: 'You have unsaved changes. Do you want to save them before continuing?',
            confirmLabel: 'Save',
            cancelLabel: 'Discard',
            variant: 'warning',
        });
    };

    const confirmDiscard = (): Promise<boolean> => {
        return confirmDialog.confirm({
            title: 'Discard Changes',
            description: 'Are you sure you want to discard your changes? This action cannot be undone.',
            confirmLabel: 'Discard',
            cancelLabel: 'Keep Editing',
            variant: 'warning',
        });
    };

    return {
        ...confirmDialog,
        confirmSave,
        confirmDiscard,
    };
}

// ログアウト確認専用フック
export function useLogoutConfirm() {
    const confirmDialog = useConfirmDialogState();

    const confirmLogout = (): Promise<boolean> => {
        return confirmDialog.confirm({
            title: 'Confirm Logout',
            description: 'Are you sure you want to log out? You will need to sign in again to access your account.',
            confirmLabel: 'Logout',
            cancelLabel: 'Stay Logged In',
            variant: 'normal',
        });
    };

    return {
        ...confirmDialog,
        confirmLogout,
    };
}
