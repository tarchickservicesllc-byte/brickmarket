import Link from 'next/link'
import { TrendingUp, Smartphone, Apple, Share, Plus, MoreHorizontal, ArrowLeft } from 'lucide-react'

export default function InstallPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Nav */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-slate-900">BrickMarket</span>
        </Link>
        <Link href="/dashboard" className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to app
        </Link>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Smartphone className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Add BrickMarket to Your Phone</h1>
          <p className="text-slate-500">Install the app on your home screen for quick access — works just like a native app.</p>
        </div>

        <div className="space-y-6">
          {/* iPhone */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center flex-shrink-0">
                <Apple className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-lg">iPhone / iPad</h2>
                <p className="text-sm text-slate-500">Using Safari browser</p>
              </div>
            </div>

            <ol className="space-y-4">
              <li className="flex gap-4">
                <div className="w-7 h-7 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">1</div>
                <div>
                  <p className="font-medium text-slate-900">Open Safari</p>
                  <p className="text-sm text-slate-500 mt-0.5">Go to <span className="font-mono text-blue-700 text-xs">brickmarket.vercel.app</span> in Safari. It must be Safari — Chrome on iPhone won&apos;t work.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="w-7 h-7 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">2</div>
                <div>
                  <p className="font-medium text-slate-900">Tap the Share button</p>
                  <p className="text-sm text-slate-500 mt-0.5">At the bottom of your screen, tap the Share icon — it looks like a box with an arrow pointing up.</p>
                  <div className="mt-2 inline-flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg">
                    <Share className="w-4 h-4 text-slate-600" />
                    <span className="text-xs text-slate-600 font-medium">Share button</span>
                  </div>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="w-7 h-7 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">3</div>
                <div>
                  <p className="font-medium text-slate-900">Tap &ldquo;Add to Home Screen&rdquo;</p>
                  <p className="text-sm text-slate-500 mt-0.5">Scroll down in the share menu and tap <strong>Add to Home Screen</strong>.</p>
                  <div className="mt-2 inline-flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg">
                    <Plus className="w-4 h-4 text-slate-600" />
                    <span className="text-xs text-slate-600 font-medium">Add to Home Screen</span>
                  </div>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="w-7 h-7 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">4</div>
                <div>
                  <p className="font-medium text-slate-900">Tap &ldquo;Add&rdquo;</p>
                  <p className="text-sm text-slate-500 mt-0.5">Tap <strong>Add</strong> in the top right corner. BrickMarket will appear on your home screen as an app icon.</p>
                </div>
              </li>
            </ol>
          </div>

          {/* Android */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-lg">Android</h2>
                <p className="text-sm text-slate-500">Using Chrome browser</p>
              </div>
            </div>

            <ol className="space-y-4">
              <li className="flex gap-4">
                <div className="w-7 h-7 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">1</div>
                <div>
                  <p className="font-medium text-slate-900">Open Chrome</p>
                  <p className="text-sm text-slate-500 mt-0.5">Go to <span className="font-mono text-blue-700 text-xs">brickmarket.vercel.app</span> in Google Chrome.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="w-7 h-7 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">2</div>
                <div>
                  <p className="font-medium text-slate-900">Tap the three-dot menu</p>
                  <p className="text-sm text-slate-500 mt-0.5">Tap the three dots in the top right corner of Chrome.</p>
                  <div className="mt-2 inline-flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg">
                    <MoreHorizontal className="w-4 h-4 text-slate-600" />
                    <span className="text-xs text-slate-600 font-medium">Menu</span>
                  </div>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="w-7 h-7 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">3</div>
                <div>
                  <p className="font-medium text-slate-900">Tap &ldquo;Add to Home Screen&rdquo;</p>
                  <p className="text-sm text-slate-500 mt-0.5">Tap <strong>Add to Home Screen</strong> or <strong>Install App</strong> — some Android versions show a banner at the bottom automatically.</p>
                  <div className="mt-2 inline-flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg">
                    <Plus className="w-4 h-4 text-slate-600" />
                    <span className="text-xs text-slate-600 font-medium">Add to Home Screen</span>
                  </div>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="w-7 h-7 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">4</div>
                <div>
                  <p className="font-medium text-slate-900">Tap &ldquo;Add&rdquo;</p>
                  <p className="text-sm text-slate-500 mt-0.5">Tap <strong>Add</strong> to confirm. BrickMarket will appear on your home screen and open fullscreen like a real app.</p>
                </div>
              </li>
            </ol>
          </div>

          {/* CTA */}
          <div className="bg-blue-700 rounded-2xl p-6 text-center">
            <h3 className="font-bold text-white text-lg mb-2">Ready to install?</h3>
            <p className="text-blue-200 text-sm mb-4">Open BrickMarket in your phone&apos;s browser and follow the steps above.</p>
            <div className="bg-white/20 rounded-xl px-4 py-2 inline-block">
              <span className="font-mono text-white text-sm font-semibold">brickmarket.vercel.app</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
