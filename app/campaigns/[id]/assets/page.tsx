"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface Asset {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadedAt: string;
  approvalStatus: "pending" | "approved" | "rejected";
}

export default function CampaignAssetsPage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const rawId = params?.id;
  const campaignId = (Array.isArray(rawId) ? rawId[0] : rawId || "") as string;
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<"GM" | "MODERATOR" | "PLAYER" | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [assetName, setAssetName] = useState("");
  const [assetUrl, setAssetUrl] = useState("");
  const [assetType, setAssetType] = useState("link");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (status === "authenticated" && campaignId) {
      fetchAssets();
    }
  }, [status, router, campaignId]);

  async function fetchAssets() {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/members`);
      if (res.ok) {
        const data = await res.json();
        setUserRole(data.role);
      }
      setAssets([]);
    } catch (error) {
      console.error("Error fetching assets:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleUploadAsset() {
    if (!assetName.trim() || !assetUrl.trim()) return;

    setUploading(true);
    try {
      // TODO: Implement asset upload API
      const newAsset: Asset = {
        id: Math.random().toString(),
        name: assetName.trim(),
        url: assetUrl.trim(),
        type: assetType,
        uploadedAt: new Date().toISOString(),
        approvalStatus: userRole === "GM" ? "approved" : "pending",
      };
      setAssets([newAsset, ...assets]);
      setAssetName("");
      setAssetUrl("");
      setAssetType("link");
      setShowUploadModal(false);
    } catch (error) {
      console.error("Error uploading asset:", error);
    } finally {
      setUploading(false);
    }
  }

  const canUpload = userRole && ["GM", "MODERATOR"].includes(userRole);
  const canApprove = userRole === "GM";

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-73px)] bg-zinc-50 dark:bg-black px-6 py-10">
        <div className="mx-auto max-w-6xl animate-pulse space-y-4">
          <div className="h-8 w-32 rounded bg-zinc-200 dark:bg-zinc-800"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-73px)] bg-zinc-50 dark:bg-black px-6 py-10">
      <main className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <Link href={`/campaigns/${campaignId}`} className="text-xs font-medium text-zinc-500">
              ← Back to Campaign
            </Link>
            <h1 className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              Campaign Assets
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Manage maps, character art, music, and other campaign resources
            </p>
          </div>
          {canUpload && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-100"
            >
              Upload Asset
            </button>
          )}
        </div>

        {/* Approval Workflow Info */}
        {!canApprove && (
          <div className="mb-8 p-4 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800">
            <p className="text-sm text-amber-900 dark:text-amber-200">
              <strong>Note:</strong> Uploaded assets require GM approval before they're visible to all players
            </p>
          </div>
        )}

        {assets.length === 0 ? (
          <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-950">
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">No assets yet</p>
            {canUpload && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-100"
              >
                Upload First Asset
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {assets.map((asset) => (
              <div
                key={asset.id}
                className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{asset.name}</h3>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">{asset.type}</p>
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded ${
                      asset.approvalStatus === "approved"
                        ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                        : asset.approvalStatus === "pending"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                          : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                    }`}
                  >
                    {asset.approvalStatus === "approved"
                      ? "Approved"
                      : asset.approvalStatus === "pending"
                        ? "Pending"
                        : "Rejected"}
                  </span>
                </div>
                <div className="mt-4 flex gap-2">
                  <a
                    href={asset.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                  >
                    View →
                  </a>
                  {canApprove && asset.approvalStatus === "pending" && (
                    <>
                      <button className="text-xs font-medium text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-100">
                        Approve
                      </button>
                      <button className="text-xs font-medium text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-100">
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Upload Asset Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-2xl rounded-lg bg-white dark:bg-zinc-950 shadow-lg">
            <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Upload Asset
              </h2>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Asset Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., Tavern Map"
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Type
                </label>
                <select
                  value={assetType}
                  onChange={(e) => setAssetType(e.target.value)}
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                >
                  <option value="link">Link</option>
                  <option value="image">Image</option>
                  <option value="document">Document</option>
                  <option value="audio">Audio</option>
                  <option value="video">Video</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  URL
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={assetUrl}
                  onChange={(e) => setAssetUrl(e.target.value)}
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </div>
            </div>
            <div className="flex gap-3 border-t border-zinc-200 px-6 py-4 dark:border-zinc-800">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setAssetName("");
                  setAssetUrl("");
                  setAssetType("link");
                }}
                className="flex-1 rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadAsset}
                disabled={uploading || !assetName.trim() || !assetUrl.trim()}
                className="flex-1 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-100"
              >
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
