import { useState, useEffect } from "react";
import { Modal, Form, Input, Switch, message, Upload } from "antd";
import type { UploadFile, UploadProps } from "antd/es/upload/interface";
import { uploadApi } from "../lib/apiClient";

interface EditPlaylistModalProps {
  visible: boolean;
  onClose: () => void;
  playlist: {
    _id: string;
    name: string;
    description?: string;
    isPublic: boolean;
    thumbnail?: string;
  };
  onSubmit: (values: {
    name: string;
    description?: string;
    isPublic: boolean;
    thumbnail?: string;
  }) => Promise<void>;
}

export default function EditPlaylistModal({
  visible,
  onClose,
  playlist,
  onSubmit,
}: EditPlaylistModalProps) {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      form.setFieldsValue({
        name: playlist?.name,
        description: playlist?.description,
        isPublic: playlist?.isPublic,
      });
      if (playlist?.thumbnail) {
        setFileList([
          {
            uid: "-1",
            name: "current_cover.jpg",
            status: "done",
            url: playlist.thumbnail,
          },
        ]);
      } else {
        setFileList([]);
      }
    }
  }, [visible, playlist, form]);

  const handleFinish = async (values: any) => {
    try {
      setIsSubmitting(true);
      let newThumbnailUrl = playlist?.thumbnail;

      // Handle image upload if a new file is uploaded
      const file = fileList[0]?.originFileObj;
      if (file) {
        const uploadRes = await uploadApi.image(file as File);
        newThumbnailUrl = uploadRes.data.data.url;
      } else if (fileList.length === 0) {
        newThumbnailUrl = ""; // Cover got removed
      }

      await onSubmit({ ...values, thumbnail: newThumbnailUrl });
    } catch (err) {
      console.error(err);
      message.error("Đã xảy ra lỗi khi lưu thông tin.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const uploadProps: UploadProps = {
    onRemove: () => {
      setFileList([]);
    },
    beforeUpload: (file) => {
      if (!file.type.startsWith("image/")) {
        message.error("Vui lòng chọn file hình ảnh hợp lệ (JPG, PNG).");
        return Upload.LIST_IGNORE;
      }
      if (file.size > 5 * 1024 * 1024) {
        message.error("Ảnh không được vượt quá 5MB.");
        return Upload.LIST_IGNORE;
      }
      setFileList([
        {
          uid: file.uid,
          name: file.name,
          status: "done", // Mark as done to prevent actual auto-uploading via antd action
          url: URL.createObjectURL(file),
          originFileObj: file,
        },
      ]);
      return false; // Prevent auto upload
    },
    fileList,
    listType: "picture-card",
    maxCount: 1,
  };

  return (
    <Modal
      title="Chỉnh sửa Playlist"
      open={visible}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      className="dark-modal"
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        className="mt-6"
      >
        <Form.Item label={<span className="text-slate-300">Ảnh bìa</span>}>
          <Upload {...uploadProps}>
            {fileList.length < 1 && (
              <div className="text-slate-400 font-medium text-sm flex flex-col items-center justify-center">
                <svg
                  className="w-6 h-6 mb-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
                Tải ảnh lên
              </div>
            )}
          </Upload>
        </Form.Item>

        <Form.Item
          name="name"
          label={<span className="text-slate-300">Tên Playlist</span>}
          rules={[{ required: true, message: "Vui lòng nhập tên playlist!" }]}
        >
          <Input
            placeholder="Nhập tên playlist..."
            className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 hover:border-zinc-500 focus:border-primary focus:bg-zinc-800 focus:shadow-none"
          />
        </Form.Item>

        <Form.Item
          name="description"
          label={<span className="text-slate-300">Mô tả (tuỳ chọn)</span>}
        >
          <Input.TextArea
            rows={3}
            placeholder="Thêm mô tả cho playlist..."
            className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 hover:border-zinc-500 focus:border-primary focus:bg-zinc-800 focus:shadow-none"
          />
        </Form.Item>

        <Form.Item name="isPublic" valuePropName="checked" className="mb-8">
          <div className="flex items-center gap-3">
            <Switch />
            <div className="flex flex-col">
              <span className="text-white font-medium">Công khai</span>
              <span className="text-xs text-slate-400">
                Người khác có thể xem playlist này
              </span>
            </div>
          </div>
        </Form.Item>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-lg font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 rounded-lg font-medium bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </Form>
    </Modal>
  );
}
