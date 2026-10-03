# ===== DÁN VÀO CUỐI NOTEBOOK COLAB (sau khi đã train xong reg_models, scaler, feature_cols) =====
import joblib, datetime, sklearn

bundle = {
    "model": reg_models['Random Forest Regressor'],   # model hồi quy dự đoán p_recall
    "scaler": scaler,                                  # StandardScaler đã fit trên X_train
    "feature_cols": feature_cols,                      # ['history_correct','history_wrong','history_accuracy','delta_days','log_delta']
    "version": "rf-duolingo-" + datetime.date.today().strftime("%Y%m%d"),
    "sklearn_version": sklearn.__version__,
}
out = "/content/drive/MyDrive/GoogleColab/Dolingo/recall_model.joblib"
joblib.dump(bundle, out, compress=3)
print("Đã lưu:", out)
print("Đặt scikit-learn==" + sklearn.__version__ + " trong MLSever/requirements.txt")
# Tải file về và đặt vào  MLSever/models/recall_model.joblib
