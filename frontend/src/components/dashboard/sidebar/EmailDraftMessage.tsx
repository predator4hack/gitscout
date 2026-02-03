import { useState } from "react";
import { EmailDraft } from "../../../types/dashboard";

interface EmailDraftMessageProps {
    emailDraft: EmailDraft;
}

export function EmailDraftMessage({ emailDraft }: EmailDraftMessageProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        const fullEmail = `Subject: ${emailDraft.subject}\n\n${emailDraft.body}`;
        try {
            await navigator.clipboard.writeText(fullEmail);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy email:", err);
        }
    };

    return (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 space-y-3">
            <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-gray-800">
                    Email Draft
                    {!emailDraft.is_generic && emailDraft.target_candidate && (
                        <span className="ml-2 text-xs text-gray-600">
                            (for @{emailDraft.target_candidate})
                        </span>
                    )}
                </div>
                <button
                    onClick={handleCopy}
                    className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 transition-colors"
                >
                    {copied ? "✓ Copied!" : "Copy"}
                </button>
            </div>

            {/* Email subject */}
            <div className="space-y-1">
                <div className="text-xs font-medium text-gray-600">Subject:</div>
                <div className="text-sm font-medium text-gray-900">
                    {emailDraft.subject}
                </div>
            </div>

            {/* Email body */}
            <div className="space-y-1">
                <div className="text-xs font-medium text-gray-600">Body:</div>
                <div className="text-sm text-gray-800 whitespace-pre-wrap bg-white border border-green-200 rounded p-3">
                    {emailDraft.body}
                </div>
            </div>

            {emailDraft.is_generic && (
                <div className="text-xs text-gray-600 italic">
                    This is a generic template. You can customize it before
                    sending.
                </div>
            )}
        </div>
    );
}
