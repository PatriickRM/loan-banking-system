import { Component, inject, signal, OnInit } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SidebarComponent, NavItem } from '../../shared/components/sidebar.component';
import { EvaluationService } from '../../core/services/evaluation.service';
import { AuthService } from '../../core/services/auth.service';
import { EvaluationResponse, EvaluationStatus, ManualEvaluationRequest } from '../../core/models/loan.models';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-evaluations-page',
  standalone: true,
  imports: [SidebarComponent, DatePipe, ReactiveFormsModule, RouterLink],
  template: `
    <div class="dashboard-layout">
      <app-sidebar [navItems]="navItems" roleLabel="ANALISTA" />

      <main class="dashboard-content">

        <!-- Header -->
        <div class="page-header anim-fade-up">
          <div>
            <div class="page-eyebrow mono">EVALUACIÓN CREDITICIA</div>
            <h1 class="page-title">Evaluaciones</h1>
          </div>
          <div class="header-actions">
            @if (loading()) {
              <div class="spinner-sm"></div>
            }
            <span class="badge badge-analista">ANALISTA</span>
          </div>
        </div>

        <!-- Stats -->
        <div class="stats-row anim-fade-up" style="animation-delay:60ms">
          @for (stat of stats(); track stat.label) {
            <div class="stat-card" [class]="'stat-' + stat.type">
              <div class="stat-val mono">{{ stat.value }}</div>
              <div class="stat-label">{{ stat.label }}</div>
              <div class="stat-bar" [style.width.%]="stat.pct"></div>
            </div>
          }
        </div>

        <!-- Filter tabs -->
        <div class="filter-bar anim-fade-up" style="animation-delay:100ms">
          @for (f of filters; track f.value) {
            <button
              class="filter-tab"
              [class.active]="activeFilter() === f.value"
              (click)="setFilter(f.value)"
            >
              {{ f.label }}
              @if (f.count !== null) {
                <span class="tab-count mono">{{ f.count }}</span>
              }
            </button>
          }
          <div class="filter-spacer"></div>
          <button class="refresh-btn" (click)="loadEvaluations()" title="Actualizar">
            ↺
          </button>
        </div>

        <!-- Table -->
        <div class="card anim-fade-up" style="animation-delay:140ms">
          @if (loading()) {
            <div class="loading-state">
              @for (i of [1,2,3,4,5]; track i) {
                <div class="skeleton-row">
                  <div class="sk sk-sm"></div>
                  <div class="sk sk-lg"></div>
                  <div class="sk sk-md"></div>
                  <div class="sk sk-sm"></div>
                  <div class="sk sk-md"></div>
                </div>
              }
            </div>
          } @else if (filteredEvals().length === 0) {
            <div class="empty-state">
              <div class="empty-icon mono">◎</div>
              <p>No hay evaluaciones {{ activeFilter() !== 'ALL' ? 'con este estado' : '' }}</p>
            </div>
          } @else {
            <div class="table-wrap">
              <table class="eval-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Cliente</th>
                    <th>Préstamo</th>
                    <th>Score Auto.</th>
                    <th>Score Manual</th>
                    <th>Score Final</th>
                    <th>Riesgo</th>
                    <th>Recomendación</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  @for (ev of filteredEvals(); track ev.id) {
                    <tr>
                      <td class="mono text-muted">#{{ ev.id }}</td>
                      <td class="mono">{{ ev.customerId }}</td>
                      <td class="mono">
                        <a [routerLink]="['/loans']" class="link-subtle">#{{ ev.loanId }}</a>
                      </td>
                      <td>
                        @if (ev.automaticScore !== null && ev.automaticScore !== undefined) {
                          <span class="score-chip" [class]="scoreClass(ev.automaticScore)">
                            {{ ev.automaticScore }}
                          </span>
                        } @else {
                          <span class="text-muted">—</span>
                        }
                      </td>
                      <td>
                        @if (ev.manualScore !== null && ev.manualScore !== undefined) {
                          <span class="score-chip" [class]="scoreClass(ev.manualScore)">
                            {{ ev.manualScore }}
                          </span>
                        } @else {
                          <span class="text-muted">—</span>
                        }
                      </td>
                      <td>
                        @if (ev.finalScore !== null && ev.finalScore !== undefined) {
                          <span class="score-chip score-final" [class]="scoreClass(ev.finalScore)">
                            {{ ev.finalScore }}
                          </span>
                        } @else {
                          <span class="text-muted">—</span>
                        }
                      </td>
                      <td>
                        @if (ev.riskLevel) {
                          <span class="risk-chip" [class]="'risk-' + ev.riskLevel.toLowerCase()">
                            {{ riskLabel(ev.riskLevel) }}
                          </span>
                        } @else {
                          <span class="text-muted">—</span>
                        }
                      </td>
                      <td>
                        @if (ev.recommendation) {
                          <span class="rec-chip" [class]="recClass(ev.recommendation)">
                            {{ recLabel(ev.recommendation) }}
                          </span>
                        } @else {
                          <span class="text-muted">—</span>
                        }
                      </td>
                      <td>
                        <span class="status-chip" [class]="statusClass(ev.status)">
                          {{ statusLabel(ev.status) }}
                        </span>
                      </td>
                      <td class="mono text-muted" style="font-size:11px;">
                        {{ ev.evaluationDate | date:'dd/MM/yy HH:mm' }}
                      </td>
                      <td>
                        @if (ev.status === 'IN_REVIEW') {
                          <button class="action-btn accent" (click)="openManualEval(ev)">
                            Evaluar
                          </button>
                        } @else {
                          <button class="action-btn ghost" (click)="openDetail(ev)">
                            Ver
                          </button>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>

      </main>
    </div>

    <!-- Manual Evaluation Modal -->
    @if (showManualModal()) {
      <div class="modal-backdrop" (click)="closeModal()">
        <div class="modal-panel" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <div class="modal-eyebrow mono">EVALUACIÓN MANUAL</div>
              <h2 class="modal-title">Completar evaluación #{{ selectedEval()?.id }}</h2>
            </div>
            <button class="close-btn" (click)="closeModal()">✕</button>
          </div>

          <div class="modal-body">
            <!-- Score info -->
            <div class="score-context">
              <div class="score-item">
                <div class="si-label mono">Score automático</div>
                <div class="si-value mono" [class]="scoreClass(selectedEval()?.automaticScore ?? 0)">
                  {{ selectedEval()?.automaticScore ?? '—' }}
                </div>
              </div>
              <div class="score-arrow">→</div>
              <div class="score-item">
                <div class="si-label mono">Score manual</div>
                <div class="si-value mono accent">{{ manualForm.value.manualScore }}</div>
              </div>
              <div class="score-arrow">→</div>
              <div class="score-item">
                <div class="si-label mono">Score final</div>
                <div class="si-value mono" [class]="scoreClass(previewFinalScore())">
                  {{ previewFinalScore() }}
                </div>
              </div>
            </div>

            <!-- Recommendation preview -->
            <div class="rec-preview" [class]="recPreviewClass()">
              <span class="rp-icon">{{ recPreviewIcon() }}</span>
              <div>
                <div class="rp-title">Recomendación estimada</div>
                <div class="rp-value mono">{{ recPreviewLabel() }}</div>
              </div>
            </div>

            <form [formGroup]="manualForm" (ngSubmit)="submitManualEval()" novalidate>

              <!-- Score slider -->
              <div class="field">
                <label>Score manual (0-100)</label>
                <div class="slider-wrap">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    formControlName="manualScore"
                    class="score-slider"
                  />
                  <span class="slider-val mono">{{ manualForm.value.manualScore }}</span>
                </div>
                <div class="slider-marks mono">
                  <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
                </div>
              </div>

              <!-- Evaluator -->
              <div class="form-row">
                <div class="field">
                  <label>ID Evaluador</label>
                  <input formControlName="evaluatorId" type="text" placeholder="ANA-001" />
                  @if (mf['evaluatorId'].invalid && mf['evaluatorId'].touched) {
                    <span class="error-msg">Requerido</span>
                  }
                </div>
                <div class="field">
                  <label>Nombre Evaluador</label>
                  <input formControlName="evaluatorName" type="text" placeholder="María Rodríguez" />
                  @if (mf['evaluatorName'].invalid && mf['evaluatorName'].touched) {
                    <span class="error-msg">Requerido</span>
                  }
                </div>
              </div>

              <!-- Comments -->
              <div class="field">
                <label>Comentarios</label>
                <textarea
                  formControlName="comments"
                  rows="3"
                  placeholder="Observaciones sobre la evaluación crediticia..."
                ></textarea>
              </div>

              @if (modalError()) {
                <div class="alert alert-error">{{ modalError() }}</div>
              }

              <div class="modal-footer">
                <button type="button" class="btn btn-ghost" (click)="closeModal()">Cancelar</button>
                <button type="submit" class="btn btn-primary" [disabled]="submitting()">
                  @if (submitting()) {
                    <span class="spinner-sm"></span> Guardando...
                  } @else {
                    Completar evaluación
                  }
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>
    }

    <!-- Detail Modal -->
    @if (showDetailModal() && selectedEval()) {
      <div class="modal-backdrop" (click)="showDetailModal.set(false)">
        <div class="modal-panel" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <div class="modal-eyebrow mono">DETALLE</div>
              <h2 class="modal-title">Evaluación #{{ selectedEval()!.id }}</h2>
            </div>
            <button class="close-btn" (click)="showDetailModal.set(false)">✕</button>
          </div>
          <div class="modal-body">
            <div class="detail-grid">
              <div class="detail-item">
                <div class="di-label">Cliente ID</div>
                <div class="di-val mono">{{ selectedEval()!.customerId }}</div>
              </div>
              <div class="detail-item">
                <div class="di-label">Préstamo ID</div>
                <div class="di-val mono">#{{ selectedEval()!.loanId }}</div>
              </div>
              <div class="detail-item">
                <div class="di-label">Score automático</div>
                <div class="di-val mono">{{ selectedEval()!.automaticScore ?? '—' }}</div>
              </div>
              <div class="detail-item">
                <div class="di-label">Score manual</div>
                <div class="di-val mono">{{ selectedEval()!.manualScore ?? '—' }}</div>
              </div>
              <div class="detail-item">
                <div class="di-label">Score final</div>
                <div class="di-val mono" style="font-size:20px;">{{ selectedEval()!.finalScore ?? '—' }}</div>
              </div>
              <div class="detail-item">
                <div class="di-label">Estado</div>
                <span class="status-chip" [class]="statusClass(selectedEval()!.status)">
                  {{ statusLabel(selectedEval()!.status) }}
                </span>
              </div>
              <div class="detail-item">
                <div class="di-label">Recomendación</div>
                @if (selectedEval()!.recommendation) {
                  <span class="rec-chip" [class]="recClass(selectedEval()!.recommendation!)">
                    {{ recLabel(selectedEval()!.recommendation!) }}
                  </span>
                } @else {
                  <span class="text-muted">—</span>
                }
              </div>
              <div class="detail-item">
                <div class="di-label">Nivel de riesgo</div>
                @if (selectedEval()!.riskLevel) {
                  <span class="risk-chip" [class]="'risk-' + selectedEval()!.riskLevel!.toLowerCase()">
                    {{ riskLabel(selectedEval()!.riskLevel!) }}
                  </span>
                } @else {
                  <span class="text-muted">—</span>
                }
              </div>
              <div class="detail-item" style="grid-column: 1/-1">
                <div class="di-label">Comentarios</div>
                <div class="di-val">{{ selectedEval()!.comments ?? 'Sin comentarios' }}</div>
              </div>
            </div>
            <div class="modal-footer" style="margin-top:0;padding-top:16px;border-top:1px solid var(--border-dim)">
              <button class="btn btn-primary" (click)="showDetailModal.set(false)">Cerrar</button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 24px;
    }

    .page-eyebrow {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: var(--text-muted);
      margin-bottom: 6px;
    }

    .page-title { font-size: 26px; font-weight: 800; }

    .header-actions { display: flex; align-items: center; gap: 12px; margin-top: 6px; }

    /* Stats */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    }

    .stat-card {
      background: var(--bg-card);
      border: 1px solid var(--border-dim);
      border-radius: var(--radius-xl);
      padding: 18px 20px;
      position: relative;
      overflow: hidden;
      transition: all var(--t-fast);
    }

    .stat-card:hover { border-color: var(--border-subtle); transform: translateY(-1px); }

    .stat-val { font-size: 32px; color: var(--text-primary); margin-bottom: 4px; letter-spacing: -0.02em; }
    .stat-label { font-size: 12px; color: var(--text-muted); }

    .stat-bar {
      position: absolute;
      bottom: 0; left: 0;
      height: 2px;
      border-radius: 0 2px 0 0;
      background: var(--accent);
      transition: width 0.6s ease;
    }

    .stat-pending .stat-bar  { background: var(--warning); }
    .stat-review .stat-bar   { background: var(--accent);  }
    .stat-approved .stat-bar { background: var(--success); }
    .stat-score .stat-bar    { background: var(--success); }

    /* Filter bar */
    .filter-bar {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }

    .filter-tab {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 100px;
      background: transparent;
      border: 1px solid var(--border-dim);
      color: var(--text-muted);
      font-size: 12px;
      cursor: pointer;
      transition: all var(--t-fast);
    }

    .filter-tab.active {
      background: var(--accent-dim);
      border-color: rgba(59,130,246,0.3);
      color: var(--accent-bright);
    }

    .tab-count {
      font-size: 10px;
      background: var(--bg-elevated);
      padding: 1px 6px;
      border-radius: 100px;
    }

    .filter-spacer { flex: 1; }

    .refresh-btn {
      width: 32px;
      height: 32px;
      background: var(--bg-elevated);
      border: 1px solid var(--border-dim);
      border-radius: var(--radius-md);
      color: var(--text-muted);
      cursor: pointer;
      font-size: 16px;
      transition: all var(--t-fast);
    }

    .refresh-btn:hover { color: var(--accent-bright); border-color: var(--accent); }

    /* Table */
    .table-wrap { overflow-x: auto; }

    .eval-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }

    .eval-table th {
      padding: 10px 14px;
      text-align: left;
      font-family: var(--font-mono);
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--text-muted);
      border-bottom: 1px solid var(--border-dim);
      white-space: nowrap;
    }

    .eval-table td {
      padding: 12px 14px;
      border-bottom: 1px solid var(--border-dim);
      vertical-align: middle;
    }

    .eval-table tr:last-child td { border-bottom: none; }

    .eval-table tr:hover td { background: var(--bg-elevated); }

    /* Chips */
    .score-chip {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 100px;
      font-family: var(--font-mono);
      font-size: 12px;
      font-weight: 600;
      border: 1px solid;
    }

    .score-chip.good   { background: var(--success-dim); color: var(--success);  border-color: rgba(34,197,94,0.3); }
    .score-chip.medium { background: var(--warning-dim); color: var(--warning);  border-color: rgba(234,179,8,0.3); }
    .score-chip.low    { background: var(--danger-dim);  color: var(--danger);   border-color: rgba(239,68,68,0.3); }
    .score-chip.none   { background: var(--bg-elevated); color: var(--text-muted); border-color: var(--border-dim); }

    .score-final { font-size: 13px !important; padding: 4px 12px !important; }

    .risk-chip, .rec-chip, .status-chip {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 100px;
      font-family: var(--font-mono);
      font-size: 10px;
      letter-spacing: 0.06em;
      white-space: nowrap;
    }

    .risk-low    { background: var(--success-dim); color: var(--success); }
    .risk-medium { background: var(--warning-dim); color: var(--warning); }
    .risk-high   { background: var(--danger-dim);  color: var(--danger);  }

    .rec-approve { background: var(--success-dim); color: var(--success); }
    .rec-reject  { background: var(--danger-dim);  color: var(--danger);  }
    .rec-review  { background: var(--warning-dim); color: var(--warning); }

    .status-pending  { background: var(--warning-dim); color: var(--warning); }
    .status-in_review { background: var(--accent-dim);  color: var(--accent-bright); }
    .status-approved { background: var(--success-dim); color: var(--success); }
    .status-rejected { background: var(--danger-dim);  color: var(--danger);  }

    .action-btn {
      padding: 5px 12px;
      border-radius: var(--radius-sm);
      font-family: var(--font-mono);
      font-size: 11px;
      cursor: pointer;
      border: 1px solid;
      transition: all var(--t-fast);
      white-space: nowrap;
    }

    .action-btn.accent {
      background: var(--accent-dim);
      border-color: rgba(59,130,246,0.3);
      color: var(--accent-bright);
    }

    .action-btn.accent:hover { background: rgba(59,130,246,0.2); }

    .action-btn.ghost {
      background: transparent;
      border-color: var(--border-dim);
      color: var(--text-muted);
    }

    .action-btn.ghost:hover { background: var(--bg-elevated); color: var(--text-primary); }

    /* Link */
    .link-subtle {
      color: var(--accent-bright);
      text-decoration: none;
      font-family: var(--font-mono);
      font-size: 12px;
    }

    .link-subtle:hover { text-decoration: underline; }

    /* Loading skeleton */
    .loading-state { padding: 8px 0; }

    .skeleton-row {
      display: flex;
      gap: 16px;
      align-items: center;
      padding: 14px 16px;
      border-bottom: 1px solid var(--border-dim);
    }

    .sk {
      height: 14px;
      border-radius: 4px;
      background: var(--bg-elevated);
      animation: shimmer 1.2s infinite;
      flex-shrink: 0;
    }

    .sk-sm { width: 60px; }
    .sk-md { width: 100px; }
    .sk-lg { width: 160px; }

    @keyframes shimmer {
      0%, 100% { opacity: 0.4; }
      50%       { opacity: 0.8; }
    }

    /* Empty */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      padding: 60px 20px;
      color: var(--text-muted);
    }

    .empty-icon { font-size: 32px; opacity: 0.25; }

    /* Modal */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(8,11,15,0.85);
      backdrop-filter: blur(4px);
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      animation: fadeIn 150ms ease;
    }

    @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }

    .modal-panel {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-xl);
      width: 100%;
      max-width: 580px;
      max-height: 90vh;
      overflow-y: auto;
      animation: slideUp 200ms cubic-bezier(0.4,0,0.2,1);
    }

    @keyframes slideUp {
      from { opacity:0; transform: translateY(20px); }
      to   { opacity:1; transform: translateY(0); }
    }

    .modal-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding: 28px 28px 0;
    }

    .modal-eyebrow {
      font-size: 10px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--accent-bright);
      margin-bottom: 6px;
    }

    .modal-title { font-size: 20px; font-weight: 800; }

    .close-btn {
      background: none;
      border: 1px solid var(--border-dim);
      color: var(--text-muted);
      border-radius: var(--radius-sm);
      width: 32px;
      height: 32px;
      cursor: pointer;
      font-size: 14px;
      transition: all var(--t-fast);
    }

    .close-btn:hover { background: var(--bg-elevated); color: var(--text-primary); }

    .modal-body { padding: 24px 28px; }

    /* Score context */
    .score-context {
      display: flex;
      align-items: center;
      gap: 16px;
      background: var(--bg-card);
      border: 1px solid var(--border-dim);
      border-radius: var(--radius-xl);
      padding: 20px;
      margin-bottom: 20px;
      justify-content: center;
    }

    .score-item { text-align: center; }

    .si-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--text-muted);
      margin-bottom: 8px;
    }

    .si-value {
      font-size: 28px;
      color: var(--text-primary);
    }

    .si-value.accent { color: var(--accent-bright); }
    .si-value.good   { color: var(--success); }
    .si-value.medium { color: var(--warning); }
    .si-value.low    { color: var(--danger);  }

    .score-arrow { font-size: 18px; color: var(--text-muted); }

    /* Rec preview */
    .rec-preview {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 18px;
      border-radius: var(--radius-lg);
      margin-bottom: 20px;
      border: 1px solid;
    }

    .rec-preview.good   { background: var(--success-dim); border-color: rgba(34,197,94,0.3); }
    .rec-preview.medium { background: var(--warning-dim); border-color: rgba(234,179,8,0.3); }
    .rec-preview.low    { background: var(--danger-dim);  border-color: rgba(239,68,68,0.3); }

    .rp-icon { font-size: 20px; }

    .rp-title { font-size: 11px; color: var(--text-muted); margin-bottom: 2px; }

    .rp-value { font-size: 14px; font-weight: 600; }
    .rec-preview.good   .rp-value { color: var(--success); }
    .rec-preview.medium .rp-value { color: var(--warning); }
    .rec-preview.low    .rp-value { color: var(--danger);  }

    /* Slider */
    .slider-wrap {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-top: 8px;
    }

    .score-slider {
      flex: 1;
      -webkit-appearance: none;
      height: 6px;
      border-radius: 3px;
      background: var(--bg-elevated);
      outline: none;
      cursor: pointer;
    }

    .score-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: var(--accent-bright);
      cursor: pointer;
      border: 2px solid var(--bg-surface);
      box-shadow: 0 0 0 2px var(--accent-dim);
    }

    .slider-val {
      font-size: 18px;
      color: var(--accent-bright);
      min-width: 36px;
      text-align: right;
    }

    .slider-marks {
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: var(--text-muted);
      padding: 0 10px;
      margin-top: 4px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }

    textarea {
      width: 100%;
      padding: 10px 14px;
      background: var(--bg-elevated);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      color: var(--text-primary);
      font-family: var(--font-display);
      font-size: 14px;
      resize: vertical;
      outline: none;
      transition: border-color var(--t-fast);
      margin-top: 8px;
    }

    textarea:focus { border-color: var(--accent); }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 20px;
    }

    /* Detail grid */
    .detail-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 20px;
    }

    .detail-item {
      background: var(--bg-elevated);
      border: 1px solid var(--border-dim);
      border-radius: var(--radius-md);
      padding: 12px 14px;
    }

    .di-label { font-size: 11px; color: var(--text-muted); margin-bottom: 4px; }
    .di-val   { font-size: 14px; color: var(--text-primary); }

    .alert { padding: 10px 14px; border-radius: var(--radius-md); font-size: 13px; margin-top: 14px; }
    .alert-error { background: var(--danger-dim); border: 1px solid rgba(239,68,68,0.25); color: #fca5a5; }

    .spinner-sm {
      width: 14px;
      height: 14px;
      border: 2px solid var(--border-subtle);
      border-top-color: var(--accent);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      display: inline-block;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 1100px) {
      .stats-row { grid-template-columns: repeat(2, 1fr); }
    }
  `],
})
export class EvaluationsPageComponent implements OnInit {
  private readonly evalService = inject(EvaluationService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(false);
  readonly evaluations = signal<EvaluationResponse[]>([]);
  readonly activeFilter = signal<string>('ALL');
  readonly showManualModal = signal(false);
  readonly showDetailModal = signal(false);
  readonly selectedEval = signal<EvaluationResponse | null>(null);
  readonly submitting = signal(false);
  readonly modalError = signal('');

  readonly navItems: NavItem[] = [
    { icon: '◈', label: 'Dashboard',    route: '/dashboard/analista' },
    { icon: '◉', label: 'Evaluaciones', route: '/evaluations' },
    { icon: '◇', label: 'Préstamos',    route: '/loans' },
    { icon: '◎', label: 'Clientes',     route: '/dashboard/analista' },
    { icon: '○', label: 'Informes',     route: '/dashboard/analista' },
  ];

  readonly manualForm = this.fb.nonNullable.group({
    manualScore:   [50, [Validators.required, Validators.min(0), Validators.max(100)]],
    evaluatorId:   ['', Validators.required],
    evaluatorName: ['', Validators.required],
    comments:      [''],
  });

  get mf() { return this.manualForm.controls; }

  readonly filters = [
    { label: 'Todas',       value: 'ALL',       count: null },
    { label: 'Pendientes',  value: 'PENDING',   count: null },
    { label: 'En revisión', value: 'IN_REVIEW', count: null },
    { label: 'Aprobadas',   value: 'APPROVED',  count: null },
    { label: 'Rechazadas',  value: 'REJECTED',  count: null },
  ];

  stats() {
    const evs = this.evaluations();
    const pending   = evs.filter(e => e.status === 'PENDING').length;
    const inReview  = evs.filter(e => e.status === 'IN_REVIEW').length;
    const approved  = evs.filter(e => e.status === 'APPROVED').length;
    const total     = evs.length || 1;
    const avgScore  = evs.filter(e => e.finalScore).length > 0
      ? Math.round(evs.reduce((acc, e) => acc + (e.finalScore ?? 0), 0) / evs.filter(e => e.finalScore).length)
      : 0;

    return [
      { label: 'Total', value: String(evs.length), pct: 100, type: 'review' },
      { label: 'Pendientes',  value: String(pending),  pct: Math.round(pending  / total * 100), type: 'pending'  },
      { label: 'En revisión', value: String(inReview), pct: Math.round(inReview / total * 100), type: 'review'   },
      { label: 'Score promedio', value: String(avgScore), pct: avgScore, type: 'score' },
    ];
  }

  filteredEvals() {
    const f = this.activeFilter();
    const evs = this.evaluations();
    if (f === 'ALL') return evs;
    return evs.filter(e => e.status === f);
  }

  previewFinalScore(): number {
    const auto   = this.selectedEval()?.automaticScore ?? 50;
    const manual = this.manualForm.value.manualScore ?? 50;
    return Math.round((auto + manual) / 2);
  }

  recPreviewClass(): string {
    const s = this.previewFinalScore();
    if (s >= 75) return 'good';
    if (s >= 50) return 'medium';
    return 'low';
  }

  recPreviewIcon(): string {
    const s = this.previewFinalScore();
    if (s >= 75) return '✓';
    if (s >= 50) return '◈';
    return '✗';
  }

  recPreviewLabel(): string {
    const s = this.previewFinalScore();
    if (s >= 75) return 'APROBAR';
    if (s >= 50) return 'REVISIÓN ADICIONAL';
    return 'RECHAZAR';
  }

  ngOnInit(): void {
    this.loadEvaluations();
  }

  loadEvaluations(): void {
    this.loading.set(true);
    // Load all statuses in parallel
    const statuses: EvaluationStatus[] = ['PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED'];
    const all: EvaluationResponse[] = [];
    let completed = 0;

    statuses.forEach(status => {
      this.evalService.getEvaluationsByStatus(status).subscribe({
        next: (evs) => {
          all.push(...evs);
          completed++;
          if (completed === statuses.length) {
            this.evaluations.set(all.sort((a, b) => b.id - a.id));
            this.loading.set(false);
          }
        },
        error: () => {
          completed++;
          if (completed === statuses.length) {
            this.evaluations.set(all);
            this.loading.set(false);
          }
        },
      });
    });
  }

  setFilter(f: string): void {
    this.activeFilter.set(f);
  }

  openManualEval(ev: EvaluationResponse): void {
    this.selectedEval.set(ev);
    this.modalError.set('');
    this.manualForm.reset({ manualScore: 50, evaluatorId: '', evaluatorName: '', comments: '' });
    this.showManualModal.set(true);
  }

  openDetail(ev: EvaluationResponse): void {
    this.selectedEval.set(ev);
    this.showDetailModal.set(true);
  }

  closeModal(): void {
    this.showManualModal.set(false);
    this.selectedEval.set(null);
  }

  submitManualEval(): void {
    this.manualForm.markAllAsTouched();
    if (this.manualForm.invalid || !this.selectedEval()) return;

    this.submitting.set(true);
    this.modalError.set('');

    const req: ManualEvaluationRequest = this.manualForm.getRawValue();

    this.evalService.completeManualEvaluation(this.selectedEval()!.id, req).subscribe({
      next: (updated) => {
        this.submitting.set(false);
        // Update list
        this.evaluations.update(evs => evs.map(e => e.id === updated.id ? updated : e));
        this.closeModal();
      },
      error: (err) => {
        this.submitting.set(false);
        this.modalError.set(err.error?.message || 'Error al guardar evaluación');
      },
    });
  }

  // Display helpers
  scoreClass(score: number | null | undefined): string {
    if (score === null || score === undefined) return 'none';
    if (score >= 75) return 'good';
    if (score >= 50) return 'medium';
    return 'low';
  }

  riskLabel(risk: string): string {
    return { LOW: 'BAJO', MEDIUM: 'MEDIO', HIGH: 'ALTO' }[risk] ?? risk;
  }

  recLabel(rec: string): string {
    return { APPROVE: 'APROBAR', REJECT: 'RECHAZAR', MANUAL_REVIEW: 'REVISIÓN' }[rec] ?? rec;
  }

  recClass(rec: string): string {
    return { APPROVE: 'rec-approve', REJECT: 'rec-reject', MANUAL_REVIEW: 'rec-review' }[rec] ?? '';
  }

  statusLabel(status: string): string {
    return { PENDING: 'PENDIENTE', IN_REVIEW: 'EN REVISIÓN', APPROVED: 'APROBADA', REJECTED: 'RECHAZADA' }[status] ?? status;
  }

  statusClass(status: string): string {
    return `status-chip status-${status.toLowerCase().replace('_', '_')}`;
  }
}