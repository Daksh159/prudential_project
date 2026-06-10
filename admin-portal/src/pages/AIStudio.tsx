import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'

interface Role { id: number; name: string; description: string }
interface PolicyRule { role: string; action: string; resource: string; effect: string }
interface RiskItem { permission: string; risk_level: 'low' | 'medium' | 'high'; reason: string }

const riskColor = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-red-100 text-red-700',
}
const riskIcon = { low: '🟢', medium: '🟡', high: '🔴' }

export default function AIStudio() {
  const [tab, setTab] = useState<'policy' | 'recommend' | 'risk'>('policy')
  const qc = useQueryClient()

  // Policy Generator state
  const [policyText, setPolicyText] = useState('')
  const [generatedRules, setGeneratedRules] = useState<PolicyRule[]>([])
  const [approvedRules, setApprovedRules] = useState<Set<number>>(new Set())
  const [policyLoading, setPolicyLoading] = useState(false)
  const [savingPolicy, setSavingPolicy] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')

  // Recommender state
  const [roleName, setRoleName] = useState('')
  const [recommendations, setRecommendations] = useState<{ recommended: { action: string; resource: string }[]; restricted: { action: string; resource: string }[]; reasoning: string } | null>(null)
  const [recLoading, setRecLoading] = useState(false)

  // Risk Detector state
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null)
  const [risks, setRisks] = useState<RiskItem[]>([])
  const [riskLoading, setRiskLoading] = useState(false)
  const [riskRole, setRiskRole] = useState('')

  const { data: roles = [] } = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: () => api.get('/roles').then((r) => r.data),
  })

  // Policy Generator
  const generatePolicy = async () => {
    if (!policyText.trim()) return
    setPolicyLoading(true)
    setGeneratedRules([])
    setApprovedRules(new Set())
    try {
      const res = await api.post('/ai/generate-policy', { text: policyText })
      setGeneratedRules(res.data.rules)
    } catch {
      setGeneratedRules([])
    } finally {
      setPolicyLoading(false)
    }
  }

  const toggleApproval = (idx: number) => {
    setApprovedRules((prev) => {
      const next = new Set(prev)
      next.has(idx) ? next.delete(idx) : next.add(idx)
      return next
    })
  }

  const savePolicy = async () => {
    const approved = generatedRules.filter((_, i) => approvedRules.has(i))
    if (!approved.length) return
    setSavingPolicy(true)
    try {
      await api.post('/policies', {
        name: `Policy: ${policyText.slice(0, 40)}…`,
        natural_language_text: policyText,
        structured_rules: approved,
      })
      qc.invalidateQueries({ queryKey: ['policies'] })
      setSavedMsg(`✅ Saved ${approved.length} rule(s) to Policy Explorer`)
      setTimeout(() => setSavedMsg(''), 3000)
    } finally {
      setSavingPolicy(false)
    }
  }

  // Recommender
  const recommend = async () => {
    if (!roleName.trim()) return
    setRecLoading(true)
    setRecommendations(null)
    try {
      const res = await api.post('/ai/recommend-permissions', { role_name: roleName })
      setRecommendations(res.data)
    } catch {
      setRecommendations(null)
    } finally {
      setRecLoading(false)
    }
  }

  // Risk Detector
  const detectRisks = async () => {
    if (!selectedRoleId) return
    setRiskLoading(true)
    setRisks([])
    const role = roles.find((r) => r.id === selectedRoleId)
    setRiskRole(role?.name || '')
    try {
      const res = await api.post('/ai/detect-risks', { role_id: selectedRoleId })
      setRisks(res.data.risks)
    } catch {
      setRisks([])
    } finally {
      setRiskLoading(false)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">🤖</span>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">AI Studio</h1>
          <p className="text-sm text-gray-500">Powered by Claude · Natural language → RBAC rules</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        {[
          { key: 'policy', label: '📝 Policy Generator' },
          { key: 'recommend', label: '💡 Permission Recommender' },
          { key: 'risk', label: '🛡️ Risk Detector' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as typeof tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition -mb-px ${
              tab === t.key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Policy Generator */}
      {tab === 'policy' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h2 className="font-semibold text-gray-700 mb-3">Natural Language Policy Input</h2>
            <textarea
              value={policyText}
              onChange={(e) => setPolicyText(e.target.value)}
              rows={4}
              placeholder='e.g. "Claims officers can approve claims under ₹50,000. Doctors can upload but not delete medical reports. Customers can only view their own policies."'
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
            <button
              onClick={generatePolicy}
              disabled={policyLoading || !policyText.trim()}
              className="mt-3 bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
            >
              {policyLoading ? '⏳ Generating…' : '✨ Generate RBAC Rules'}
            </button>
          </div>

          {generatedRules.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex justify-between items-center mb-3">
                <h2 className="font-semibold text-gray-700">
                  Generated Rules ({generatedRules.length}) — select to approve
                </h2>
                {approvedRules.size > 0 && (
                  <button
                    onClick={savePolicy}
                    disabled={savingPolicy}
                    className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
                  >
                    {savingPolicy ? 'Saving…' : `Save ${approvedRules.size} Approved`}
                  </button>
                )}
              </div>
              {savedMsg && <p className="text-green-600 text-sm mb-3">{savedMsg}</p>}
              <div className="space-y-2">
                {generatedRules.map((rule, i) => (
                  <div
                    key={i}
                    onClick={() => toggleApproval(i)}
                    className={`p-3 rounded-lg border cursor-pointer transition ${
                      approvedRules.has(i) ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{approvedRules.has(i) ? '✅' : '⬜'}</span>
                      <div className="flex-1 flex flex-wrap gap-2 text-xs">
                        <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-medium">
                          {rule.role}
                        </span>
                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{rule.action}</span>
                        <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{rule.resource}</span>
                        <span
                          className={`px-2 py-0.5 rounded font-medium ${
                            rule.effect === 'allow' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {rule.effect?.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Permission Recommender */}
      {tab === 'recommend' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h2 className="font-semibold text-gray-700 mb-3">Role-Based Permission Recommender</h2>
            <div className="flex gap-3">
              <input
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                placeholder="e.g. Fraud Investigator, Field Agent, Senior Underwriter"
                className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                onKeyDown={(e) => e.key === 'Enter' && recommend()}
              />
              <button
                onClick={recommend}
                disabled={recLoading || !roleName.trim()}
                className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                {recLoading ? '⏳ Thinking…' : '💡 Recommend'}
              </button>
            </div>
          </div>

          {recommendations && (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl shadow-sm p-5">
                <h3 className="font-semibold text-green-700 mb-3">✅ Recommended Permissions</h3>
                <div className="space-y-1">
                  {recommendations.recommended.map((p, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                      <span className="font-mono text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">
                        {p.action}_{p.resource}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-5">
                <h3 className="font-semibold text-red-700 mb-3">🚫 Should NOT Have</h3>
                <div className="space-y-1">
                  {recommendations.restricted.map((p, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                      <span className="font-mono text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded">
                        {p.action}_{p.resource}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2 bg-indigo-50 rounded-xl p-4 text-sm text-indigo-800">
                <strong>AI Reasoning:</strong> {recommendations.reasoning}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Risk Detector */}
      {tab === 'risk' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h2 className="font-semibold text-gray-700 mb-3">Permission Risk Analyzer</h2>
            <div className="flex gap-3">
              <select
                value={selectedRoleId ?? ''}
                onChange={(e) => setSelectedRoleId(Number(e.target.value) || null)}
                className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select a role to analyze…</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
              <button
                onClick={detectRisks}
                disabled={riskLoading || !selectedRoleId}
                className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                {riskLoading ? '⏳ Scanning…' : '🛡️ Detect Risks'}
              </button>
            </div>
          </div>

          {!riskLoading && selectedRoleId && risks.length === 0 && riskRole && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
              <div className="text-2xl mb-2">✅</div>
              <p className="text-green-700 font-medium">No risks detected for <strong>{riskRole}</strong></p>
              <p className="text-green-600 text-sm mt-1">All permissions look appropriate for this role.</p>
            </div>
          )}

          {risks.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h2 className="font-semibold text-gray-700 mb-3">
                Risk Report for <span className="text-indigo-600">{riskRole}</span> — {risks.length} issue(s)
              </h2>
              <div className="space-y-3">
                {risks.map((risk, i) => (
                  <div key={i} className="border rounded-lg p-3 flex items-start gap-3">
                    <span className="text-xl">{riskIcon[risk.risk_level]}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{risk.permission}</span>
                        <span className={`text-xs px-2 py-0.5 rounded font-medium uppercase ${riskColor[risk.risk_level]}`}>
                          {risk.risk_level}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{risk.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
